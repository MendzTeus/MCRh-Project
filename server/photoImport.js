// Copies apartment photos from Airbnb's CDN into the site's own storage.
//
// Until now the site only stored *links* to Airbnb (a0.muscache.com). When a
// host replaces or deletes a photo on Airbnb, the link starts returning 404
// and the photo disappears from the site and the admin ("Room 6" had 15 of 30
// broken). Importing downloads each image once and keeps a copy in the
// `property-media` bucket, so it stays available no matter what happens on
// Airbnb.
const crypto = require('crypto');

const BUCKET = 'property-media';
const MAX_BYTES = 8 * 1024 * 1024;
const MAX_URLS = 120;
const CONCURRENCY = 4;
const TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' };

// Only Airbnb's image CDN — the server never fetches arbitrary URLs (SSRF).
function isAirbnbImageUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && (u.hostname === 'a0.muscache.com' || u.hostname.endsWith('.muscache.com'));
  } catch {
    return false;
  }
}

async function download(url, fetchImpl = fetch) {
  const res = await fetchImpl(url, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) return { error: res.status === 404 ? 'não existe mais no Airbnb' : `Airbnb respondeu ${res.status}` };
  const contentType = (res.headers.get('content-type') || '').split(';')[0].trim();
  if (!TYPES[contentType]) return { error: `tipo de arquivo inesperado (${contentType || 'desconhecido'})` };
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length > MAX_BYTES) return { error: 'arquivo maior que 8 MB' };
  return { buffer, contentType };
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  }));
  return out;
}

/**
 * Imports the given Airbnb photo URLs for one apartment.
 * - A URL already saved as a link (MediaAsset without storagePath) is copied
 *   and the same row updated in place: category, order, hidden and cover
 *   are kept.
 * - A URL not saved yet becomes a new photo at the end of the list.
 * - URLs already imported are skipped.
 */
async function importUnitPhotos({ supabase, unitSlug, urls, alt, fetchImpl = fetch }) {
  const unique = [...new Set((urls || []).filter((u) => typeof u === 'string'))];
  if (unique.length > MAX_URLS) throw Object.assign(new Error(`máximo de ${MAX_URLS} fotos por vez`), { status: 400 });
  const invalid = unique.filter((u) => !isAirbnbImageUrl(u));
  if (invalid.length) throw Object.assign(new Error('só é possível importar fotos do Airbnb (a0.muscache.com)'), { status: 400 });

  const { data: rows0, error: exErr } = await supabase
    .from('MediaAsset')
    .select('id, url, storagePath, displayOrder, sourceUrl')
    .eq('ownerType', 'unit').eq('ownerSlug', unitSlug);
  if (exErr) {
    // `sourceUrl` (migration 006) remembers which Airbnb photo a copy came
    // from; without it the admin can't tell imported photos from links.
    if (/sourceUrl/.test(exErr.message || '')) {
      throw Object.assign(new Error('rode a migration 006 (coluna sourceUrl) antes de importar fotos'), { status: 409 });
    }
    throw exErr;
  }
  let rows = rows0;
  rows = rows || [];
  const importedSources = new Set(rows.filter((r) => r.storagePath).map((r) => r.sourceUrl || r.url));
  const linkRows = new Map(rows.filter((r) => !r.storagePath).map((r) => [r.url, r]));
  let nextOrder = rows.reduce((m, r) => Math.max(m, (r.displayOrder ?? -1) + 1), 0);

  const todo = unique.filter((u) => !importedSources.has(u));
  const results = await mapLimit(todo, CONCURRENCY, async (url) => {
    const file = await download(url, fetchImpl).catch((e) => ({ error: e.name === 'TimeoutError' ? 'o Airbnb demorou demais para responder' : e.message }));
    if (file.error) return { url, error: file.error };

    const path = `units/${unitSlug}/airbnb-${crypto.createHash('sha1').update(url).digest('hex').slice(0, 16)}.${TYPES[file.contentType]}`;
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file.buffer, { contentType: file.contentType, upsert: true });
    if (upErr) return { url, error: upErr.message };
    const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    const now = new Date().toISOString();

    const link = linkRows.get(url);
    if (link) {
      const { error } = await supabase.from('MediaAsset').update({ url: publicUrl, storagePath: path, sourceUrl: url, updatedAt: now }).eq('id', link.id);
      return error ? { url, error: error.message } : { url, action: 'updated' };
    }
    const row = {
      id: crypto.randomUUID(), ownerType: 'unit', ownerSlug: unitSlug,
      url: publicUrl, storagePath: path, sourceUrl: url, alt: alt || null,
      isPrimary: false, displayOrder: nextOrder++, createdAt: now, updatedAt: now,
    };
    const { error } = await supabase.from('MediaAsset').insert(row);
    return error ? { url, error: error.message } : { url, action: 'inserted' };
  });

  return {
    imported: results.filter((r) => r.action).length,
    alreadyImported: unique.length - todo.length,
    failed: results.filter((r) => r.error).map(({ url, error }) => ({ url, error })),
  };
}

function isAirbnbListingUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && /(^|\.)airbnb\.[a-z.]+$/.test(u.hostname);
  } catch {
    return false;
  }
}

/**
 * Reads an Airbnb listing page and returns its current photo URLs, in the
 * order Airbnb shows them. Only photos of that listing are kept
 * ("Hosting-<room id>" / "miso/Hosting-<room id>"), not host avatars or other
 * listings' thumbnails that the page also embeds.
 */
async function fetchListingPhotoUrls(listingUrl, fetchImpl = fetch) {
  if (!isAirbnbListingUrl(listingUrl)) throw Object.assign(new Error('link do Airbnb inválido no cadastro do apartamento'), { status: 400 });
  const res = await fetchImpl(listingUrl, {
    redirect: 'follow',
    signal: AbortSignal.timeout(20000),
    headers: { 'accept-language': 'en-GB,en;q=0.9', 'user-agent': 'Mozilla/5.0 (compatible; MCRh listing photo import)' },
  });
  if (!res.ok) throw Object.assign(new Error(`o Airbnb respondeu ${res.status} para o anúncio`), { status: 502 });
  const html = await res.text();
  const roomId = (res.url || listingUrl).match(/\/rooms\/(\d+)/)?.[1];
  const all = [...new Set(
    [...html.matchAll(/https:\/\/a0\.muscache\.com\/im\/pictures\/[^"'\\< ]+/g)]
      .map((m) => m[0].replace(/&amp;/g, '&').replace(/\\u0026/g, '&').replace(/\?.*$/, ''))
      .filter((u) => !u.includes('AirbnbPlatformAssets') && !u.includes('/user/')),
  )];
  const own = roomId ? all.filter((u) => u.includes(`Hosting-${roomId}`)) : [];
  return own.length ? own : all;
}

module.exports = { importUnitPhotos, isAirbnbImageUrl, isAirbnbListingUrl, fetchListingPhotoUrls };
