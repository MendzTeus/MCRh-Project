const express = require('express');
const { supabase } = require('./db');

const router = express.Router();

// Public read model for the site. A unit is shown only when it is both manually
// VISIBLE (admin toggle) AND still LISTED on Airbnb (daily auto-check). With
// their photos ordered.
router.get('/units', async (_req, res) => {
  const [unitsResult, mediaResult, reviewsResult, hiddenResult] = await Promise.all([
    supabase
      .from('Unit')
      .select('unitSlug, unitName, displayTitle, propertySlug, propertyName, suppliedSpecs, postcode, airbnbUrl, description, squareFeet, displayOrder')
      .eq('visible', true)
      .eq('airbnbListed', true)
      .order('displayOrder'),
    supabase
      .from('MediaAsset')
      .select('id, ownerSlug, url, alt, isPrimary, displayOrder, roomCategory, hidden')
      .eq('ownerType', 'unit')
      .order('displayOrder')
      .then((r) => r.error?.message?.includes('column')
        ? supabase.from('MediaAsset').select('id, ownerSlug, url, alt, isPrimary, displayOrder').eq('ownerType', 'unit').order('displayOrder')
        : r),
    supabase.from('Review').select('propertySlug, rating').eq('published', true),
    supabase.from('Unit').select('unitSlug').or('visible.eq.false,airbnbListed.eq.false'),
  ]);

  if (unitsResult.error) return res.status(500).json({ error: unitsResult.error.message });

  const byUnit = {};
  ((await mediaResult).data || []).forEach((m) => { (byUnit[m.ownerSlug] ||= []).push(m); });

  // Pre-compute avg rating per unit from published reviews.
  const ratingsBySlug = {};
  (reviewsResult.data || []).forEach((r) => {
    if (r.rating > 0) (ratingsBySlug[r.propertySlug] ||= []).push(r.rating);
  });

  const result = (unitsResult.data || []).map((u) => {
    const photos = byUnit[u.unitSlug] || [];
    const primary = photos.find((p) => p.isPrimary) || photos[0];
    const ratings = ratingsBySlug[u.unitSlug] || [];
    const avgRating = ratings.length
      ? (ratings.reduce((s, n) => s + n, 0) / ratings.length).toFixed(2)
      : null;
    return { ...u, primaryImage: primary?.url || null, photos, avgRating };
  });

  // Explicit list of hidden slugs so the site knows exactly what to remove
  // (never inferred from absence — keeps the public site safe if the DB lags).
  const hiddenSlugs = (hiddenResult.data || []).map((h) => h.unitSlug);

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

// Canonical public building content. The five editable fields live only on
// Property; static properties.ts data remains responsible for media, amenities,
// specs and other non-canonical presentation data.
router.get('/properties', async (_req, res) => {
  const { data, error } = await supabase
    .from('Property')
    .select('slug, name, area, eyebrow, neighborhoodTitle, description')
    .order('displayOrder')
    .order('name');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// Public property gallery photos.
router.get('/properties/:slug/photos', async (req, res) => {
  const { data, error } = await supabase.from('MediaAsset').select('id, url, alt, isPrimary, displayOrder').eq('ownerType', 'property').eq('ownerSlug', req.params.slug).order('displayOrder');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// Public reviews — only published, ordered by displayOrder.
router.get('/reviews', async (req, res) => {
  const featuredHome = req.query.featured === 'home';
  const q = supabase
    .from('Review')
    .select('id, propertySlug, name, date, text, rating, avatarUrl')
    .eq('published', true);

  if (featuredHome) {
    q.not('sourceReviewId', 'is', null)
      .not('avatarUrl', 'is', null)
      .not('text', 'is', null)
      .gte('rating', 4)
      .order('rating', { ascending: false })
      .order('displayOrder')
      .limit(60);
  } else {
    q.order('displayOrder');
  }

  if (req.query.property) {
    const slugs = String(req.query.property).split(',').map((slug) => slug.trim()).filter(Boolean);
    if (slugs.length === 1) q.eq('propertySlug', slugs[0]);
    if (slugs.length > 1) q.in('propertySlug', slugs);
  }
  const { data, error } = await q;
  if (error) return res.status(500).json({ error: error.message });

  if (featuredHome) {
    const recent = [...(data || [])].sort((a, b) => {
      const aDate = Date.parse(a.date || '') || 0;
      const bDate = Date.parse(b.date || '') || 0;
      return bDate - aDate;
    });
    const concise = recent.filter((review) => review.text.length >= 60 && review.text.length <= 320);
    const conciseIds = new Set(concise.map((review) => review.id));
    const candidates = [...concise, ...recent.filter((review) => !conciseIds.has(review.id))];
    const selected = [];
    const seenListings = new Set();
    for (const review of candidates) {
      if (seenListings.has(review.propertySlug)) continue;
      seenListings.add(review.propertySlug);
      selected.push(review);
      if (selected.length === 3) break;
    }
    return res.json(selected);
  }

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
