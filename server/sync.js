const ical = require('node-ical');
const { supabase } = require('./db');

// Map propertySlug → Property.id (cached at startup)
let propertyIdCache = {};

async function loadPropertyIds() {
  const { data } = await supabase.from('Property').select('id, slug');
  if (data) {
    propertyIdCache = Object.fromEntries(data.map((p) => [p.slug, p.id]));
  }
}

// Sync iCal for one unit — fetches URL, parses events, upserts BlockedDates
async function syncUnit(unit) {
  const urls = [unit.icalAirbnbUrl, unit.icalVrboUrl].filter(Boolean);
  if (!urls.length) return { unit: unit.unitSlug, skipped: true };

  const propertyId = propertyIdCache[unit.propertySlug] || unit.propertySlug;
  const runAt = new Date().toISOString();
  const blocked = [];
  let anyFetchOk = false;

  for (const url of urls) {
    try {
      const events = await ical.async.fromURL(url);
      anyFetchOk = true;
      for (const ev of Object.values(events)) {
        if (ev.type !== 'VEVENT') continue;
        if (!ev.start || !ev.end) continue;
        blocked.push({
          id: `${unit.unitSlug}-${ev.uid || ev.start.toISOString()}`.slice(0, 64),
          propertyId,
          unitSlug: unit.unitSlug,
          start: ev.start,
          end: ev.end,
          source: url.includes('vrbo') ? 'vrbo' : 'airbnb',
          syncedAt: runAt,
          createdAt: runAt,
          updatedAt: runAt,
        });
      }
    } catch (err) {
      console.error(`[sync] Failed to fetch iCal for ${unit.unitSlug}:`, err.message);
    }
  }

  // If every calendar fetch failed, leave the existing BlockedDates untouched.
  // Wiping them on a transient network error would wrongly show a booked unit as
  // available (overbooking risk), so we fail closed and keep the last-known data.
  if (!anyFetchOk) return { unit: unit.unitSlug, error: 'fetch_failed' };

  // Write the current blocks FIRST (upsert on id), then remove only the rows that
  // were not refreshed in this run. Ordering it this way means a failed upsert
  // leaves the old blocks in place (fail closed), while an empty-but-successful
  // calendar (all bookings cancelled) still clears the stale rows below.
  if (blocked.length) {
    const { error } = await supabase.from('BlockedDate').upsert(blocked);
    if (error) {
      console.error(`[sync] Upsert error for ${unit.unitSlug}:`, error.message);
      return { unit: unit.unitSlug, error: error.message };
    }
  }

  // Remove blocks for this unit that this run did not refresh (cancellations).
  const { error: delErr } = await supabase
    .from('BlockedDate')
    .delete()
    .eq('unitSlug', unit.unitSlug)
    .lt('syncedAt', runAt);
  if (delErr) console.error(`[sync] Cleanup error for ${unit.unitSlug}:`, delErr.message);

  // Update lastSyncedAt
  await supabase.from('Unit').update({ lastSyncedAt: runAt }).eq('unitSlug', unit.unitSlug);

  return { unit: unit.unitSlug, events: blocked.length };
}

async function syncAll() {
  await loadPropertyIds();
  const { data: units, error } = await supabase.from('Unit').select('*');
  if (error || !units?.length) return [];
  return Promise.all(units.map(syncUnit));
}

module.exports = { syncAll, syncUnit, loadPropertyIds };
