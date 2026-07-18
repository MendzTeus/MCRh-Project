const express = require('express');
const { supabase } = require('./db');

const router = express.Router();

// Public read model for the site. A unit is shown only when it is both manually
// VISIBLE (admin toggle) AND still LISTED on Airbnb (daily auto-check). With
// their photos ordered.
router.get('/units', async (_req, res) => {
  const { data: units, error } = await supabase
    .from('Unit')
    .select('unitSlug, unitName, propertySlug, propertyName, suppliedSpecs, postcode, airbnbUrl, description, squareFeet, displayOrder')
    .eq('visible', true)
    .eq('airbnbListed', true)
    .order('displayOrder');
  if (error) return res.status(500).json({ error: error.message });

  const { data: media } = await supabase
    .from('MediaAsset')
    .select('ownerSlug, url, alt, isPrimary, displayOrder')
    .eq('ownerType', 'unit')
    .order('displayOrder');

  const byUnit = {};
  (media || []).forEach((m) => { (byUnit[m.ownerSlug] ||= []).push(m); });

  const result = (units || []).map((u) => {
    const photos = byUnit[u.unitSlug] || [];
    const primary = photos.find((p) => p.isPrimary) || photos[0];
    return { ...u, primaryImage: primary?.url || null, photos };
  });

  // Explicit list of hidden slugs so the site knows exactly what to remove
  // (never inferred from absence — keeps the public site safe if the DB lags).
  // Hidden = manually hidden OR unlisted on Airbnb by the daily check.
  const { data: hidden } = await supabase
    .from('Unit').select('unitSlug').or('visible.eq.false,airbnbListed.eq.false');
  const hiddenSlugs = (hidden || []).map((h) => h.unitSlug);

  res.json({ units: result, hiddenSlugs, count: result.length });
});

// Public site content: text/numbers/links + image-slot overrides.
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

// Public property gallery photos.
router.get('/properties/:slug/photos', async (req, res) => {
  const { data, error } = await supabase.from('MediaAsset').select('id, url, alt, isPrimary, displayOrder').eq('ownerType', 'property').eq('ownerSlug', req.params.slug).order('displayOrder');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// Public reviews — only published, ordered by displayOrder.
router.get('/reviews', async (req, res) => {
  const q = supabase.from('Review').select('id, propertySlug, name, date, text, rating, avatarUrl').eq('published', true).order('displayOrder');
  if (req.query.property) q.eq('propertySlug', req.query.property);
  const { data, error } = await q;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// Public enquiry submission.
router.post('/enquiries', async (req, res) => {
  const { name, email, phone, message, propertyName, checkIn, checkOut, guests, unitSlug, source } = req.body || {};
  if (!name || !email) return res.status(400).json({ error: 'name and email required' });
  const row = {
    id: require('crypto').randomUUID(),
    name, email,
    phone: phone || null,
    message: message || null,
    propertyName: propertyName || 'General',
    checkIn: checkIn || null,
    checkOut: checkOut || null,
    guests: guests ? parseInt(guests, 10) : null,
    unitSlug: unitSlug || null,
    source: source || null,
    status: 'novo',
    createdAt: new Date().toISOString(),
  };
  const { error } = await supabase.from('Enquiry').insert(row);
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ ok: true });
});

module.exports = router;
