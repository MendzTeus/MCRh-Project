const express = require('express');
const crypto = require('crypto');
const { supabase } = require('./db');
const { signToken, requireAdmin } = require('./auth');

const router = express.Router();
const BUCKET = 'property-media';

// Fields an admin is allowed to edit on a Unit (allowlist — nothing else gets through).
const EDITABLE = ['unitName', 'suppliedSpecs', 'postcode', 'airbnbUrl', 'description', 'squareFeet', 'visible', 'displayOrder'];

// ── Login: password → signed token ──────────────────────────────────
router.post('/login', (req, res) => {
  const { password } = req.body || {};
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return res.status(500).json({ error: 'ADMIN_PASSWORD not configured' });
  const a = Buffer.from(String(password || ''));
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  res.json({ token: signToken({ role: 'admin' }) });
});

// Everything below requires a valid admin token.
router.use(requireAdmin);

// ── List all units (including hidden) with their photos ─────────────
router.get('/units', async (_req, res) => {
  const { data: units, error } = await supabase
    .from('Unit')
    .select('unitSlug, unitName, propertySlug, propertyName, suppliedSpecs, postcode, airbnbUrl, description, squareFeet, visible, displayOrder')
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

module.exports = router;
