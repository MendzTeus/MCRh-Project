/* One-off seed: loads the static airbnbInventory list and upserts it into the
   Supabase `Unit` table so the operational admin has real apartments to manage.
   Idempotent — upserts on unitSlug, sets visible=true only on first insert.
   Run:  node scripts/seed-units.cjs                                        */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;
if (!url || !key) { console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_KEY'); process.exit(1); }
const supabase = createClient(url, key);

// Extract the array literal from the TS source and evaluate it (our own file).
const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'airbnbInventory.ts'), 'utf8');
const start = src.indexOf('airbnbInventory: AirbnbInventoryUnit[] = [');
const open = src.indexOf('[', start);
const close = src.indexOf('\n];', open);
const arrayLiteral = src.slice(open, close + 2); // include closing ]
// eslint-disable-next-line no-eval
const inventory = eval(arrayLiteral);

async function main() {
  const now = new Date().toISOString();
  const rows = inventory.map((u, i) => ({
    id: u.unitSlug,
    unitSlug: u.unitSlug,
    unitName: u.unitName,
    propertySlug: u.propertySlug,
    propertyName: u.propertyName,
    suppliedSpecs: u.suppliedSpecs || null,
    postcode: u.postcode || null,
    airbnbUrl: u.airbnbUrl || null,
    displayOrder: i,
    createdAt: now,
    updatedAt: now,
  }));

  // Do NOT overwrite `visible` or media on re-run — only set fields we own here.
  const { error } = await supabase.from('Unit').upsert(rows, { onConflict: 'unitSlug' });
  if (error) { console.error('Seed failed:', error.message); process.exit(1); }

  const { count } = await supabase.from('Unit').select('*', { count: 'exact', head: true });
  console.log(`Seeded ${rows.length} units. Unit table now has ${count} rows.`);
}
main();
