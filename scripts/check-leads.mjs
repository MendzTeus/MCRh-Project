// READ-ONLY diagnostic: how many enquiries exist per status, and which ones
// still carry the legacy Portuguese status ("novo"/"lido"/"arquivado") that
// migration 004 converts. Before the Phase 1 fix, "novo" leads never showed as
// pending on the new Leads page / Dashboard. Nothing is written to the database.
//
// Usage: npm run check:leads   (needs SUPABASE_URL / SUPABASE_SERVICE_KEY in .env)
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_KEY are required (see .env.example).');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const { data, error } = await supabase
  .from('Enquiry')
  .select('status, name, propertyName, createdAt')
  .order('createdAt', { ascending: false });

if (error) {
  console.error('Query failed:', error.message);
  process.exit(1);
}

const byStatus = {};
for (const lead of data) byStatus[lead.status ?? '(empty)'] = (byStatus[lead.status ?? '(empty)'] || 0) + 1;

console.log(`\nTotal enquiries: ${data.length}`);
console.table(byStatus);

const unseen = data.filter((lead) => lead.status === 'novo');
const legacy = data.filter((lead) => ['novo', 'lido', 'arquivado'].includes(lead.status)).length;
console.log(`\nRows with legacy status (converted by migration 004): ${legacy}`);
console.log(`Status "novo" — never answered through the new Leads page: ${unseen.length}`);
console.table(unseen.slice(0, 20).map((lead) => ({
  createdAt: lead.createdAt?.slice(0, 16).replace('T', ' '),
  name: lead.name,
  property: lead.propertyName,
})));
