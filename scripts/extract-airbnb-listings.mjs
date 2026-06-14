import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = path.join(rootDir, 'src/data/airbnbListings.generated.json');
const inventoryModule = await import(pathToFileURL(path.join(rootDir, 'src/data/airbnbInventory.ts')).href);
const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, value = 'true'] = arg.replace(/^--/, '').split('=');
  return [key, value];
}));

const propertyFilter = args.get('property');
const inventory = inventoryModule.airbnbInventory
  .filter((unit) => unit.airbnbUrl)
  .filter((unit) => !propertyFilter || unit.propertySlug === propertyFilter);
const limit = args.has('limit') ? Number(args.get('limit')) : inventory.length;
const delayMs = args.has('delay') ? Number(args.get('delay')) : 9000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function decode(value) {
  return value
    ?.replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#x27;', "'")
    .replaceAll('&nbsp;', ' ')
    .replaceAll('\\u0026', '&')
    .trim();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function meta(html, property) {
  const escaped = escapeRegExp(property);
  return decode(html.match(new RegExp(`<meta[^>]+property=["']${escaped}["'][^>]+content=["']([^"']+)`, 'i'))?.[1]);
}

function canonical(html) {
  return decode(
    html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i)?.[1]
    || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i)?.[1],
  );
}

function splitOgTitle(value) {
  if (!value) return {};
  const parts = value.split(' · ').map((item) => item.trim());
  const rating = parts.find((part) => part.startsWith('★'))?.replace('★', '') || null;
  return {
    roomType: parts[0] || null,
    rating,
    specsFromAirbnb: parts.filter((part) => !part.startsWith('★')).slice(1),
  };
}

function uniqueImageUrls(html) {
  return [...new Set(
    [...html.matchAll(/https:\/\/a0\.muscache\.com\/im\/pictures\/[^"'\\< ]+/g)]
      .map((match) => decode(match[0]))
      .filter((url) => url && !url.includes('AirbnbPlatformAssets'))
      .map((url) => url.replace(/\?.*$/, '')),
  )];
}

async function readExistingResults() {
  try {
    const parsed = JSON.parse(await readFile(outputPath, 'utf8'));
    return Array.isArray(parsed.results) ? parsed.results : [];
  } catch {
    return [];
  }
}

async function fetchListing(unit, attempt = 1) {
  const response = await fetch(unit.airbnbUrl, {
    redirect: 'follow',
    headers: {
      'accept-language': 'en-GB,en;q=0.9',
      'user-agent': 'Mozilla/5.0 (compatible; MCRh listing metadata import)',
    },
  });
  const html = await response.text();

  if ((response.status === 429 || response.status >= 500) && attempt < 3) {
    await sleep(delayMs * attempt);
    return fetchListing(unit, attempt + 1);
  }

  const ogTitle = meta(html, 'og:title');
  const imageUrls = uniqueImageUrls(html);

  return {
    propertySlug: unit.propertySlug,
    propertyName: unit.propertyName,
    unitSlug: unit.unitSlug,
    unitName: unit.unitName,
    suppliedSpecs: unit.suppliedSpecs || null,
    postcode: unit.postcode,
    inputUrl: unit.airbnbUrl,
    status: response.status,
    finalUrl: response.url,
    canonical: canonical(html) || null,
    title: decode(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]) || null,
    airbnbName: meta(html, 'og:description') || null,
    ogTitle: ogTitle || null,
    ...splitOgTitle(ogTitle),
    primaryImage: meta(html, 'og:image') || imageUrls[0] || null,
    imageUrls: imageUrls.slice(0, 30),
    likelyInvalid: response.status !== 200 || response.url.includes('/s/homes') || response.url.includes('/users/show/'),
    importedAt: new Date().toISOString(),
  };
}

const existingResults = await readExistingResults();
const resultBySlug = new Map(existingResults.map((result) => [result.unitSlug, result]));
const selected = inventory.slice(0, limit);

for (const [index, unit] of selected.entries()) {
  const existing = resultBySlug.get(unit.unitSlug);
  if (existing?.status === 200 && !args.has('force')) {
    console.log(`[skip] ${unit.unitSlug}`);
    continue;
  }

  console.log(`[${index + 1}/${selected.length}] ${unit.unitSlug}`);
  try {
    resultBySlug.set(unit.unitSlug, await fetchListing(unit));
  } catch (error) {
    resultBySlug.set(unit.unitSlug, {
      propertySlug: unit.propertySlug,
      propertyName: unit.propertyName,
      unitSlug: unit.unitSlug,
      unitName: unit.unitName,
      suppliedSpecs: unit.suppliedSpecs || null,
      postcode: unit.postcode,
      inputUrl: unit.airbnbUrl,
      error: error instanceof Error ? error.message : String(error),
      importedAt: new Date().toISOString(),
    });
  }

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    sourceCount: inventory.length,
    results: [...resultBySlug.values()].sort((a, b) => a.unitSlug.localeCompare(b.unitSlug)),
  }, null, 2)}\n`);

  if (index < selected.length - 1) await sleep(delayMs);
}

console.log(`Wrote ${outputPath}`);
