// Daily Airbnb listing check.
//
// Some units point at Airbnb listings that the host has "unlisted" (paused/hidden)
// — those must not appear on the public site. When the host re-lists, the unit
// should come back automatically. This module probes each unit's Airbnb URL and
// keeps the `airbnbListed` flag in sync with reality.
//
// Fail-safe by design: it only flips a unit to HIDDEN when it positively detects
// an unlisted/removed page, and only flips back to SHOWN when it positively
// detects a live listing. An ambiguous or throttled fetch (Airbnb rate-limits and
// occasionally serves an empty stub) leaves the current flag untouched, so a
// transient block can never wrongly hide a good unit.

const { supabase } = require('./db');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function ogTitle(html) {
  const m = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i);
  return m ? m[1].trim() : null;
}

// Returns { listed: true | false | null }.
//   true  — a live listing was confirmed (og:title present, no error markers)
//   false — an unlisted/removed listing was confirmed (Airbnb's 404 page, which
//           it serves with HTTP 200, or a redirect away from the listing)
//   null  — ambiguous (throttled / empty stub / network error): do not change
async function probeListing(url, { attempts = 3, backoffMs = 8000 } = {}) {
  let response;
  let html = '';
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      response = await fetch(url, {
        redirect: 'follow',
        headers: {
          'accept-language': 'en-GB,en;q=0.9',
          'user-agent': 'Mozilla/5.0 (compatible; MCRh listing check)',
        },
      });
      html = await response.text();
      // Retry throttling / server errors with a growing backoff.
      if ((response.status === 429 || response.status >= 500) && attempt < attempts) {
        await sleep(backoffMs * attempt);
        continue;
      }
      break;
    } catch (err) {
      if (attempt >= attempts) return { listed: null, reason: err.message };
      await sleep(backoffMs * attempt);
    }
  }

  if (!response) return { listed: null, reason: 'no_response' };

  const finalUrl = response.url || url;
  // Same "removed/inactive listing" signals the extractor uses: Airbnb serves its
  // "404 Page Not Found" page for unlisted homes with an HTTP 200, and bounces
  // dead links to search / user pages.
  const unlisted = response.status === 404
    || finalUrl.includes('/s/homes')
    || finalUrl.includes('/users/show/')
    || /404 Page Not Found/i.test(html);

  if (unlisted) return { listed: false, reason: 'unlisted' };
  if (response.status === 200 && ogTitle(html)) return { listed: true, reason: 'active' };
  // Reachable but no clear signal either way (stub / throttle): leave as-is.
  return { listed: null, reason: `ambiguous_${response.status}` };
}

// Checks every unit that has an Airbnb URL, one at a time with a gap between
// requests (Airbnb rate-limits parallel fetches), and updates `airbnbListed`.
async function checkAllListings({ delayMs = 8000 } = {}) {
  const { data: units, error } = await supabase
    .from('Unit')
    .select('unitSlug, airbnbUrl, airbnbListed')
    .not('airbnbUrl', 'is', null);
  if (error || !units?.length) return [];

  const results = [];
  for (const unit of units) {
    if (!unit.airbnbUrl) continue;
    const outcome = await probeListing(unit.airbnbUrl);
    const now = new Date().toISOString();
    const patch = { airbnbCheckedAt: now };
    // Only write a confident result; ambiguous probes just record the check time.
    if (outcome.listed === true || outcome.listed === false) {
      patch.airbnbListed = outcome.listed;
      patch.updatedAt = now;
    }

    const { error: upErr } = await supabase.from('Unit').update(patch).eq('unitSlug', unit.unitSlug);
    if (upErr) console.error(`[airbnb-check] Update error for ${unit.unitSlug}:`, upErr.message);

    const changed = outcome.listed != null && outcome.listed !== unit.airbnbListed;
    if (changed) {
      console.log(`[airbnb-check] ${unit.unitSlug} → ${outcome.listed ? 'listed (showing)' : 'unlisted (hiding)'}`);
    }
    results.push({ unit: unit.unitSlug, ...outcome, changed });
    await sleep(delayMs);
  }
  return results;
}

module.exports = { checkAllListings, probeListing };
