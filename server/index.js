const express = require('express');
const { supabase } = require('./db');
const { syncAll, syncUnit, loadPropertyIds } = require('./sync');
const adminRouter = require('./admin');
const contentRouter = require('./content');

const app = express();
// Larger limit so base64 photo uploads fit in the JSON body.
app.use(express.json({ limit: '15mb' }));

app.use('/api/admin', adminRouter);
app.use('/api/content', contentRouter);

// Map propertySlug → Property.id
const slugToId = {};

// Guard for the sync endpoints — fails closed: if SYNC_SECRET is not configured,
// or the header does not match, the request is rejected. Returns false (and sends
// the 401) when unauthorized so callers can `if (!requireSyncSecret(req, res)) return;`.
function requireSyncSecret(req, res) {
  const secret = req.headers['x-sync-secret'];
  if (!process.env.SYNC_SECRET || secret !== process.env.SYNC_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

async function boot() {
  const { data } = await supabase.from('Property').select('id, slug');
  if (data) data.forEach((p) => { slugToId[p.slug] = p.id; });
  await loadPropertyIds();
  console.log('[api] Property map loaded:', Object.keys(slugToId));
}

// GET /api/availability?property=chambers&checkIn=2026-07-16&checkOut=2026-07-25
app.get('/api/availability', async (req, res) => {
  const { property, checkIn, checkOut } = req.query;
  if (!property || !checkIn || !checkOut) {
    return res.status(400).json({ error: 'property, checkIn, checkOut required' });
  }

  const propertyId = slugToId[property];
  if (!propertyId) return res.status(404).json({ error: 'Property not found' });

  // Get all units for this property
  const { data: units, error: uErr } = await supabase
    .from('Unit')
    .select('unitSlug, unitName, icalAirbnbUrl, icalVrboUrl')
    .eq('propertySlug', property);

  if (uErr) return res.status(500).json({ error: uErr.message });

  // If no units configured yet, return empty
  if (!units?.length) {
    return res.json({ property, checkIn, checkOut, units: [], configured: false });
  }

  const unitSlugs = units.map((u) => u.unitSlug);

  // Find blocked units that overlap the requested range
  // A unit is blocked if: blocked.start < checkOut AND blocked.end > checkIn
  const { data: blocked, error: bErr } = await supabase
    .from('BlockedDate')
    .select('unitSlug')
    .in('unitSlug', unitSlugs)
    .lt('start', checkOut)
    .gt('end', checkIn);

  if (bErr) return res.status(500).json({ error: bErr.message });

  const blockedSlugs = new Set((blocked || []).map((b) => b.unitSlug));

  const result = units.map((u) => ({
    unitSlug: u.unitSlug,
    unitName: u.unitName,
    available: !blockedSlugs.has(u.unitSlug),
    hasIcal: Boolean(u.icalAirbnbUrl || u.icalVrboUrl),
  }));

  res.json({ property, checkIn, checkOut, units: result, configured: true });
});

// POST /api/sync — trigger iCal sync (called by cron or manually)
app.post('/api/sync', async (req, res) => {
  if (!requireSyncSecret(req, res)) return;
  try {
    const results = await syncAll();
    res.json({ ok: true, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sync/:unitSlug — sync one unit
app.post('/api/sync/:unitSlug', async (req, res) => {
  if (!requireSyncSecret(req, res)) return;
  const { unitSlug } = req.params;
  const { data: unit } = await supabase.from('Unit').select('*').eq('unitSlug', unitSlug).single();
  if (!unit) return res.status(404).json({ error: 'Unit not found' });
  const result = await syncUnit(unit);
  res.json({ ok: true, ...result });
});

// GET /api/units/:property — list units and sync status
app.get('/api/units/:property', async (req, res) => {
  const { data, error } = await supabase
    .from('Unit')
    .select('unitSlug, unitName, lastSyncedAt, icalAirbnbUrl, icalVrboUrl')
    .eq('propertySlug', req.params.property)
    .order('unitSlug');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// GET /api/availability/units?unitSlugs=a,b,c&checkIn=...&checkOut=...
// Batch check for the Properties page — no property table lookup needed
app.get('/api/availability/units', async (req, res) => {
  const { unitSlugs, checkIn, checkOut } = req.query;
  if (!unitSlugs || !checkIn || !checkOut) {
    return res.status(400).json({ error: 'unitSlugs, checkIn, checkOut required' });
  }
  const slugList = String(unitSlugs).split(',').filter(Boolean);
  if (!slugList.length) return res.json({ units: {}, configured: false });

  const { data: blocked, error } = await supabase
    .from('BlockedDate')
    .select('unitSlug')
    .in('unitSlug', slugList)
    .lt('start', checkOut)
    .gt('end', checkIn);

  if (error) return res.status(500).json({ error: error.message });

  const blockedSlugs = new Set((blocked || []).map((b) => b.unitSlug));
  const units = {};
  slugList.forEach((slug) => { units[slug] = !blockedSlugs.has(slug); });

  res.json({ units, configured: true });
});

// Health check
app.get('/api/health', (_, res) => res.json({ ok: true }));

const PORT = process.env.API_PORT || 3001;
boot()
  .catch((err) => console.error('[api] Boot failed, starting anyway:', err.message))
  .finally(() => {
    app.listen(PORT, () => console.log(`[api] Listening on :${PORT}`));
  });
