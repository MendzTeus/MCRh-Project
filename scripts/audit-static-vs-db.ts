// READ-ONLY audit: compares what the public site hard-codes (src/data/*) with
// what the database holds. Nothing is written. Used to plan moving static
// content into the database (Phase 6).
//
// Usage: npx tsx scripts/audit-static-vs-db.ts   (needs SUPABASE_URL / SUPABASE_SERVICE_KEY)
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { properties } from '../src/data/properties';
import { airbnbInventory } from '../src/data/airbnbInventory';
import { mapLocationDefaults } from '../src/data/locations';

const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY are required');
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

async function all(table: string, select = '*') {
  const { data, error } = await sb.from(table).select(select);
  if (error) throw new Error(`${table}: ${error.message}`);
  return (data || []) as unknown as Record<string, unknown>[];
}

const diff = (a: string[], b: string[]) => a.filter((x) => !b.includes(x));

const [dbProps, dbUnits, content] = await Promise.all([
  all('Property'), all('Unit'), all('SiteContent', 'key, value, updatedAt'),
]);

console.log('\n== Columns');
console.log('Property:', Object.keys(dbProps[0] || {}).join(', '));
console.log('Unit:    ', Object.keys(dbUnits[0] || {}).join(', '));

const staticPropSlugs = properties.map((p) => p.slug);
const dbPropSlugs = dbProps.map((p) => String(p.slug));
console.log('\n== Buildings (Property)');
console.log('static:', staticPropSlugs.length, '| db:', dbPropSlugs.length);
console.log('only in code:', diff(staticPropSlugs, dbPropSlugs));
console.log('only in db:  ', diff(dbPropSlugs, staticPropSlugs));

const staticUnitSlugs = airbnbInventory.map((u) => u.unitSlug);
const dbUnitSlugs = dbUnits.map((u) => String(u.unitSlug));
console.log('\n== Apartments (Unit)');
console.log('static inventory:', staticUnitSlugs.length, '| db:', dbUnitSlugs.length);
console.log('only in code:', diff(staticUnitSlugs, dbUnitSlugs));
console.log('only in db:  ', diff(dbUnitSlugs, staticUnitSlugs));
const moved = airbnbInventory.filter((s) => {
  const d = dbUnits.find((u) => u.unitSlug === s.unitSlug);
  return d && d.propertySlug !== s.propertySlug;
}).map((s) => `${s.unitSlug}: code=${s.propertySlug} db=${dbUnits.find((u) => u.unitSlug === s.unitSlug)?.propertySlug}`);
console.log('building differs:', moved);
console.log('db hidden/unlisted:', dbUnits.filter((u) => u.visible === false || u.airbnbListed === false).map((u) => u.unitSlug));

console.log('\n== Map pins');
console.log('pins in code:', mapLocationDefaults.length, '| overrides saved:', Object.keys((content.find((c) => c.key === 'map.locations')?.value as object) || {}).length);
console.log('units with own coordinates:', dbUnits.filter((u) => u.latitude != null && u.longitude != null).map((u) => u.unitSlug));

console.log('\n== SiteContent property.* (go live with Phase 4)');
for (const c of content.filter((c) => String(c.key).startsWith('property.')).sort((a, b) => String(a.key).localeCompare(String(b.key)))) {
  const v = JSON.stringify(c.value);
  console.log(`${String(c.key).padEnd(40)} ${String(c.updatedAt).slice(0, 10)}  ${v.length > 110 ? v.slice(0, 110) + '…' : v}`);
}

const known = new Set(Object.keys(await import('../src/content/siteDefaults.generated.json', { with: { type: 'json' } }).then((m) => m.default)));
const otherKeys = content.map((c) => String(c.key)).filter((k) => !k.startsWith('property.') && !known.has(k) && k !== 'map.locations' && k !== 'home.featured');
console.log('\n== SiteContent keys the site does not read:', otherKeys.length);
console.log(otherKeys.sort().join('\n'));
