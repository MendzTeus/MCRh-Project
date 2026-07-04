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
  res.json({ units: result, count: result.length });
});

module.exports = router;
