import { airbnbInventory, getInventoryUnit } from '../data/airbnbInventory';
import { getPropertyBySlug, getUnitBySlug, type Property } from '../data/properties';

// Slugs the site links to that aren't collections themselves but belong to one:
// the Chambers buildings are inventory "properties" (9 and 11 Chapel Walks)
// shown on the single Chambers collection page. Previously they only worked
// because any unknown slug silently fell back to Chambers.
const COLLECTION_ALIASES: Record<string, string> = {
  'chambers-9': 'chambers',
  'chambers-11': 'chambers',
};

/** The collection a URL slug refers to, or undefined when it doesn't exist. */
export function resolveCollection(slug?: string): Property | undefined {
  if (!slug) return undefined;
  return getPropertyBySlug(slug) || getPropertyBySlug(COLLECTION_ALIASES[slug]);
}

export type UnitRoute =
  | { kind: 'ok' }
  | { kind: 'redirect'; to: string }
  | { kind: 'notFound' };

/**
 * Decides what an apartment URL should show.
 * - /properties/:propertySlug/:id — ok when the unit exists in that collection
 *   (Airbnb inventory or the static unit list).
 * - /property/:id — legacy short form: inventory units redirect to their full
 *   URL; static/legacy units (incl. numeric ids) still render in place.
 */
export function resolveUnitRoute(propertySlug: string | undefined, id: string | undefined): UnitRoute {
  if (!id) return { kind: 'notFound' };

  if (!propertySlug) {
    const inventoryUnit = airbnbInventory.find((unit) => unit.unitSlug === id);
    if (inventoryUnit) return { kind: 'redirect', to: `/properties/${inventoryUnit.propertySlug}/${id}` };
    return getUnitBySlug(id) ? { kind: 'ok' } : { kind: 'notFound' };
  }

  if (getInventoryUnit(propertySlug, id)) return { kind: 'ok' };
  const collection = resolveCollection(propertySlug);
  if (collection?.units.some((unit) => unit.slug === id)) return { kind: 'ok' };
  if (getUnitBySlug(id)) return { kind: 'ok' };
  return { kind: 'notFound' };
}
