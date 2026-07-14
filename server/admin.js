const express = require('express');
const crypto = require('crypto');
const { supabase } = require('./db');
const { signToken, requireAdmin } = require('./auth');

const router = express.Router();
const BUCKET = 'property-media';

// ── Login rate-limit ────────────────────────────────────────────────
// In-memory sliding window per IP. A single shared password is the only secret,
// so throttle brute-force: after MAX_ATTEMPTS failures inside WINDOW_MS, reject
// with 429 until the window clears. A successful login resets that IP.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const attempts = new Map(); // ip → number[] (timestamps of recent failures)

function loginThrottle(req, res, next) {
  // nginx sets (and overwrites) X-Real-IP with the real client address, so it's
  // trustworthy here; fall back to the socket address for direct/local calls.
  const ip = req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  const recent = (attempts.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_ATTEMPTS) {
    res.set('Retry-After', String(Math.ceil(WINDOW_MS / 1000)));
    return res.status(429).json({ error: 'Muitas tentativas. Tente novamente mais tarde.' });
  }
  attempts.set(ip, recent);
  req._loginIp = ip;
  next();
}

function recordFailure(ip) {
  const recent = attempts.get(ip) || [];
  recent.push(Date.now());
  attempts.set(ip, recent);
}

// Fields an admin is allowed to edit on a Unit (allowlist — nothing else gets through).
const EDITABLE = ['unitName', 'suppliedSpecs', 'postcode', 'airbnbUrl', 'description', 'squareFeet', 'visible', 'displayOrder', 'icalAirbnbUrl', 'icalVrboUrl'];

// ── Login: password → signed token ──────────────────────────────────
router.post('/login', loginThrottle, (req, res) => {
  const { password } = req.body || {};
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return res.status(500).json({ error: 'ADMIN_PASSWORD not configured' });
  const a = Buffer.from(String(password || ''));
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    recordFailure(req._loginIp);
    return res.status(401).json({ error: 'Invalid password' });
  }
  attempts.delete(req._loginIp); // success clears this IP's failure count
  res.json({ token: signToken({ role: 'admin' }) });
});

// Everything below requires a valid admin token.
router.use(requireAdmin);

// ── List all units (including hidden) with their photos ─────────────
router.get('/units', async (_req, res) => {
  const { data: units, error } = await supabase
    .from('Unit')
    .select('unitSlug, unitName, propertySlug, propertyName, suppliedSpecs, postcode, airbnbUrl, description, squareFeet, icalAirbnbUrl, icalVrboUrl, visible, airbnbListed, displayOrder')
    .order('displayOrder');
  if (error) return res.status(500).json({ error: error.message });

  const { data: media } = await supabase
    .from('MediaAsset')
    .select('*')
    .eq('ownerType', 'unit')
    .order('displayOrder');

  const byUnit = {};
  (media || []).forEach((m) => { (byUnit[m.ownerSlug] ||= []).push(m); });
  res.json({ units: (units || []).map((u) => ({ ...u, photos: byUnit[u.unitSlug] || [] })) });
});

// ── Edit a unit (name, specs, airbnb link, visible toggle, ...) ─────
router.patch('/units/:unitSlug', async (req, res) => {
  const patch = {};
  for (const k of EDITABLE) if (k in (req.body || {})) patch[k] = req.body[k];
  if (!Object.keys(patch).length) return res.status(400).json({ error: 'No editable fields' });
  patch.updatedAt = new Date().toISOString();

  const { data, error } = await supabase
    .from('Unit').update(patch).eq('unitSlug', req.params.unitSlug).select().single();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Unit not found' });
  res.json({ unit: data });
});

// ── Upload a photo (base64 JSON body — no multipart dep) ────────────
router.post('/units/:unitSlug/photos', async (req, res) => {
  const { unitSlug } = req.params;
  const { dataBase64, contentType, alt } = req.body || {};
  if (!dataBase64 || !contentType) return res.status(400).json({ error: 'dataBase64 and contentType required' });

  const ext = (contentType.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
  const path = `units/${unitSlug}/${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
  const buffer = Buffer.from(dataBase64, 'base64');

  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, buffer, { contentType, upsert: false });
  if (upErr) return res.status(500).json({ error: upErr.message });

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);

  // New photo goes to the end; if the unit has no photos yet, make it primary.
  const { count } = await supabase.from('MediaAsset').select('*', { count: 'exact', head: true })
    .eq('ownerType', 'unit').eq('ownerSlug', unitSlug);
  const now = new Date().toISOString();
  const row = {
    id: crypto.randomUUID(),
    ownerType: 'unit', ownerSlug: unitSlug,
    url: pub.publicUrl, storagePath: path, alt: alt || null,
    isPrimary: (count || 0) === 0, displayOrder: count || 0,
    createdAt: now, updatedAt: now,
  };
  const { data, error } = await supabase.from('MediaAsset').insert(row).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ photo: data });
});

// ── Edit a photo's alt / primary flag ───────────────────────────────
router.patch('/photos/:id', async (req, res) => {
  const { id } = req.params;
  const patch = { updatedAt: new Date().toISOString() };
  if ('alt' in (req.body || {})) patch.alt = req.body.alt;

  if (req.body && req.body.isPrimary === true) {
    // Only one primary per owner: clear the others first.
    const { data: target } = await supabase.from('MediaAsset').select('ownerType, ownerSlug').eq('id', id).single();
    if (!target) return res.status(404).json({ error: 'Photo not found' });
    await supabase.from('MediaAsset').update({ isPrimary: false })
      .eq('ownerType', target.ownerType).eq('ownerSlug', target.ownerSlug);
    patch.isPrimary = true;
  }
  const { data, error } = await supabase.from('MediaAsset').update(patch).eq('id', id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ photo: data });
});

// ── Reorder a unit's photos ─────────────────────────────────────────
router.post('/units/:unitSlug/photos/reorder', async (req, res) => {
  const { orderedIds } = req.body || {};
  if (!Array.isArray(orderedIds)) return res.status(400).json({ error: 'orderedIds array required' });
  const now = new Date().toISOString();
  for (let i = 0; i < orderedIds.length; i++) {
    await supabase.from('MediaAsset').update({ displayOrder: i, updatedAt: now }).eq('id', orderedIds[i]);
  }
  res.json({ ok: true });
});

// ── Delete a photo (Storage object + row) ───────────────────────────
router.delete('/photos/:id', async (req, res) => {
  const { data: photo } = await supabase.from('MediaAsset').select('storagePath').eq('id', req.params.id).single();
  if (!photo) return res.status(404).json({ error: 'Photo not found' });
  if (photo.storagePath) await supabase.storage.from(BUCKET).remove([photo.storagePath]);
  const { error } = await supabase.from('MediaAsset').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ── Property gallery photos (same MediaAsset table, ownerType='property') ──
router.post('/properties/:slug/photos', async (req, res) => {
  const { slug } = req.params;
  const { dataBase64, contentType, alt } = req.body || {};
  if (!dataBase64 || !contentType) return res.status(400).json({ error: 'dataBase64 and contentType required' });

  const ext = (contentType.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
  const path = `properties/${slug}/${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, Buffer.from(dataBase64, 'base64'), { contentType, upsert: false });
  if (upErr) return res.status(500).json({ error: upErr.message });

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const { count } = await supabase.from('MediaAsset').select('*', { count: 'exact', head: true }).eq('ownerType', 'property').eq('ownerSlug', slug);
  const now = new Date().toISOString();
  const row = { id: crypto.randomUUID(), ownerType: 'property', ownerSlug: slug, url: pub.publicUrl, storagePath: path, alt: alt || null, isPrimary: (count || 0) === 0, displayOrder: count || 0, createdAt: now, updatedAt: now };
  const { data, error } = await supabase.from('MediaAsset').insert(row).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ photo: data });
});

router.get('/properties/:slug/photos', async (req, res) => {
  const { data, error } = await supabase.from('MediaAsset').select('*').eq('ownerType', 'property').eq('ownerSlug', req.params.slug).order('displayOrder');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

router.post('/properties/:slug/photos/reorder', async (req, res) => {
  const { orderedIds } = req.body || {};
  if (!Array.isArray(orderedIds)) return res.status(400).json({ error: 'orderedIds array required' });
  const now = new Date().toISOString();
  for (let i = 0; i < orderedIds.length; i++) {
    await supabase.from('MediaAsset').update({ displayOrder: i, updatedAt: now }).eq('id', orderedIds[i]);
  }
  res.json({ ok: true });
});

// ── Site content (text/numbers/links) + image slots ─────────────────

// All content + images in one call for the admin UI.
router.get('/site', async (_req, res) => {
  const [{ data: content }, { data: images }] = await Promise.all([
    supabase.from('SiteContent').select('key, value'),
    supabase.from('SiteImage').select('slot, url, alt'),
  ]);
  const contentMap = {};
  (content || []).forEach((c) => { contentMap[c.key] = c.value; });
  const imageMap = {};
  (images || []).forEach((i) => { imageMap[i.slot] = { url: i.url, alt: i.alt }; });
  res.json({ content: contentMap, images: imageMap });
});

// Edit one content key (text, number, or structured JSON).
router.put('/content/:key', async (req, res) => {
  if (!('value' in (req.body || {}))) return res.status(400).json({ error: 'value required' });
  const { error } = await supabase.from('SiteContent')
    .upsert({ key: req.params.key, value: req.body.value, updatedAt: new Date().toISOString() }, { onConflict: 'key' });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// Upload/replace the image for a named slot (base64 JSON body).
router.post('/images/:slot', async (req, res) => {
  const { slot } = req.params;
  const { dataBase64, contentType, alt } = req.body || {};
  if (!dataBase64 || !contentType) return res.status(400).json({ error: 'dataBase64 and contentType required' });

  const ext = (contentType.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
  const path = `site/${slot}/${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, Buffer.from(dataBase64, 'base64'), { contentType, upsert: false });
  if (upErr) return res.status(500).json({ error: upErr.message });
  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);

  // Remove the previous file for this slot so the bucket doesn't accumulate orphans.
  const { data: prev } = await supabase.from('SiteImage').select('storagePath').eq('slot', slot).single();
  if (prev?.storagePath) await supabase.storage.from(BUCKET).remove([prev.storagePath]);

  const { error } = await supabase.from('SiteImage')
    .upsert({ slot, url: pub.publicUrl, storagePath: path, alt: alt || null, updatedAt: new Date().toISOString() }, { onConflict: 'slot' });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ slot, url: pub.publicUrl });
});

// Revert a slot to the site's built-in default (removes the override).
router.delete('/images/:slot', async (req, res) => {
  const { data: prev } = await supabase.from('SiteImage').select('storagePath').eq('slot', req.params.slot).single();
  if (prev?.storagePath) await supabase.storage.from(BUCKET).remove([prev.storagePath]);
  await supabase.from('SiteImage').delete().eq('slot', req.params.slot);
  res.json({ ok: true });
});

// ── Reviews CRUD ────────────────────────────────────────────────────
router.get('/reviews', async (req, res) => {
  const q = supabase.from('Review').select('*').order('propertySlug').order('displayOrder');
  if (req.query.property) q.eq('propertySlug', req.query.property);
  const { data, error } = await q;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/reviews', async (req, res) => {
  const { propertySlug, name, date, text, rating, published, displayOrder } = req.body || {};
  if (!propertySlug) return res.status(400).json({ error: 'propertySlug required' });
  const row = { id: crypto.randomUUID(), propertySlug, name: name || null, date: date || null, text: text || null, rating: rating ?? 5, published: published ?? true, displayOrder: displayOrder ?? 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  const { data, error } = await supabase.from('Review').insert(row).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.patch('/reviews/:id', async (req, res) => {
  const allowed = ['name', 'date', 'text', 'rating', 'published', 'displayOrder'];
  const patch = { updatedAt: new Date().toISOString() };
  for (const k of allowed) if (k in (req.body || {})) patch[k] = req.body[k];
  const { data, error } = await supabase.from('Review').update(patch).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/reviews/:id', async (req, res) => {
  const { error } = await supabase.from('Review').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

module.exports = router;
