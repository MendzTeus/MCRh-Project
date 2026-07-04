const express = require('express');
const { supabase } = require('./db');

const router = express.Router();

// Public read model for the site. Only VISIBLE units, with their photos ordered.
router.get('/units', async (_req, res) => {
  const { data: units, error } = await supabase
    .from('Unit')
    .select('unitSlug, unitName, propertySlug, propertyName, suppliedSpecs, postcode, airbnbUrl, description, squareFeet, displayOrder')
    .eq('visible', true)
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
  const { data: hidden } = await supabase.from('Unit').select('unitSlug').eq('visible', false);
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

module.exports = router;
