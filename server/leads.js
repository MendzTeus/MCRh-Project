// Lead (Enquiry) status vocabulary — the single source of truth.
//
// Canonical values are English: new → contacted → closed. Older rows (and the
// legacy admin tab) used Portuguese values; they're mapped on read so every
// screen sees one vocabulary, and a one-off migration
// (database/migrations/004_enquiry_status.sql) rewrites them in the database.
const LEAD_STATUSES = ['new', 'contacted', 'closed'];

const LEGACY_STATUS = {
  novo: 'new',
  lido: 'contacted',
  arquivado: 'closed',
};

// Maps any stored value to a canonical status. Unknown/empty values count as
// "new" so a lead is never hidden from the pending queue by a bad value.
function normalizeLeadStatus(status) {
  if (LEAD_STATUSES.includes(status)) return status;
  return LEGACY_STATUS[status] || 'new';
}

// Every stored value that means the given canonical status — used to filter
// in the database while legacy rows still exist.
function storedValuesFor(status) {
  return [status, ...Object.keys(LEGACY_STATUS).filter((legacy) => LEGACY_STATUS[legacy] === status)];
}

function normalizeLead(row) {
  return { ...row, status: normalizeLeadStatus(row.status) };
}

module.exports = { LEAD_STATUSES, normalizeLeadStatus, storedValuesFor, normalizeLead };
