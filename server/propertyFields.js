// Canonical building/collection fields stored on the Property table.
//
// Text fields have always been canonical here. Headline, amenities, specs and
// nearby distances are too (Phase 6): a NULL column means "use the built-in
// value from src/data/properties.ts", so the site never shows a blank.
//
// `nearby` arrives with migration 005. Until it runs, reads fall back to a
// select without it (the site then uses the built-in distances).
const TEXT_FIELDS = ['name', 'area', 'eyebrow', 'neighborhoodTitle', 'description', 'headline'];
const NUMBER_FIELDS = ['maxGuests', 'bedrooms', 'beds', 'bathrooms'];
const LIST_FIELDS = ['amenities', 'nearby'];
const EDITABLE_PROPERTY_FIELDS = [...TEXT_FIELDS, ...NUMBER_FIELDS, ...LIST_FIELDS];

const BASE_COLUMNS = ['slug', ...TEXT_FIELDS, ...NUMBER_FIELDS, 'amenities'];
const PUBLIC_SELECT = [...BASE_COLUMNS, 'nearby'].join(', ');
const PUBLIC_SELECT_LEGACY = BASE_COLUMNS.join(', ');
const ADMIN_SELECT = `${PUBLIC_SELECT}, displayOrder, updatedAt`;
const ADMIN_SELECT_LEGACY = `${PUBLIC_SELECT_LEGACY}, displayOrder, updatedAt`;

const MAX_TEXT = 2000;
const MAX_ITEMS = 40;

const isMissingColumn = (error) => Boolean(error && /nearby/.test(error.message || '') && /column|schema cache/i.test(error.message || ''));

/** Runs a Property query with `nearby`, retrying without it if the column doesn't exist yet. */
async function selectWithFallback(build, select, legacySelect) {
  const first = await build(select);
  if (!isMissingColumn(first.error)) return first;
  return build(legacySelect);
}

/**
 * Validates a PATCH body. Returns { patch } or { error }.
 * Empty values become NULL (= back to the built-in default), except `name`.
 */
function validatePropertyPatch(body) {
  const patch = {};
  for (const field of EDITABLE_PROPERTY_FIELDS) {
    if (!(field in (body || {}))) continue;
    const value = body[field];

    if (TEXT_FIELDS.includes(field)) {
      if (value !== null && typeof value !== 'string') return { error: `${field} must be a string` };
      if (typeof value === 'string' && value.length > MAX_TEXT) return { error: `${field} is too long` };
      if (field === 'name') {
        if (!value || !value.trim()) return { error: 'name cannot be empty' };
        patch.name = value;
      } else {
        patch[field] = value && value.trim() ? value : (field === 'description' ? '' : null);
      }
    } else if (NUMBER_FIELDS.includes(field)) {
      if (value === null || value === '') { patch[field] = null; continue; }
      if (!Number.isInteger(value) || value < 1 || value > 50) return { error: `${field} must be a whole number between 1 and 50` };
      patch[field] = value;
    } else if (field === 'amenities') {
      if (value === null) { patch.amenities = null; continue; }
      if (!Array.isArray(value) || value.length > MAX_ITEMS || !value.every((v) => typeof v === 'string' && v.length <= 200)) {
        return { error: 'amenities must be a list of short texts' };
      }
      const items = value.map((v) => v.trim()).filter(Boolean);
      patch.amenities = items.length ? items : null;
    } else if (field === 'nearby') {
      if (value === null) { patch.nearby = null; continue; }
      const valid = Array.isArray(value) && value.length <= MAX_ITEMS && value.every((row) =>
        row && typeof row === 'object' && typeof row.location === 'string' && typeof row.time === 'string'
        && row.location.length <= 200 && row.time.length <= 100);
      if (!valid) return { error: 'nearby must be a list of { location, time }' };
      const rows = value
        .map((row) => ({ location: row.location.trim(), time: row.time.trim() }))
        .filter((row) => row.location && row.time);
      patch.nearby = rows.length ? rows : null;
    }
  }
  if (!Object.keys(patch).length) return { error: 'No editable fields' };
  return { patch };
}

module.exports = {
  EDITABLE_PROPERTY_FIELDS,
  PUBLIC_SELECT,
  PUBLIC_SELECT_LEGACY,
  ADMIN_SELECT,
  ADMIN_SELECT_LEGACY,
  selectWithFallback,
  validatePropertyPatch,
};
