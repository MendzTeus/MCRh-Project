import type { NearbyPlace, Property } from '../data/properties';
import { getLocationsForProperty, type MapLocation } from '../data/locations';
import type { PublicPropertyFields } from '../hooks/usePublicProperties';

// ── Collection content edited in the admin (Property table) ─────────────────
// Headline, amenities, distances and specs live on the Property row. A NULL or
// empty column means "use the built-in value" from properties.ts, so a blank
// in the database can never blank out part of a page.

const positiveInt = (n: unknown) => (typeof n === 'number' && Number.isInteger(n) && n > 0 ? n : undefined);
const nonEmpty = (s: unknown) => (typeof s === 'string' && s.trim() ? s : undefined);

/** Amenities are stored as a list of texts; older rows may hold `{ item }` objects. */
export function readAmenities(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value
    .map((v) => nonEmpty(typeof v === 'string' ? v : (v as { item?: unknown })?.item))
    .filter((v): v is string => Boolean(v));
  return items.length ? items : undefined;
}

export function readNearby(value: unknown): NearbyPlace[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const rows = value
    .map((r) => ({ location: nonEmpty((r as NearbyPlace)?.location), time: nonEmpty((r as NearbyPlace)?.time) }))
    .filter((r): r is NearbyPlace => Boolean(r.location && r.time));
  return rows.length ? rows : undefined;
}

export function applyPropertyContent(property: Property, row?: Partial<PublicPropertyFields> | null): Property {
  if (!row) return property;
  return {
    ...property,
    headline: nonEmpty(row.headline) ?? property.headline,
    amenities: readAmenities(row.amenities) ?? property.amenities,
    distances: readNearby(row.nearby) ?? property.distances,
    maxGuests: positiveInt(row.maxGuests) ?? property.maxGuests,
    bedrooms: positiveInt(row.bedrooms) ?? property.bedrooms,
    beds: positiveInt(row.beds) ?? property.beds,
    bathrooms: positiveInt(row.bathrooms) ?? property.bathrooms,
  };
}

// ── Map pin for one apartment page ──────────────────────────────────────────

/**
 * The pin(s) for an apartment's "Neighborhood" map:
 * 1. the apartment's own building (e.g. Loom Street, 9 Chapel Walks) rather
 *    than every building of its collection;
 * 2. positioned by the apartment's own coordinates when the admin set them,
 *    otherwise by the building pin (which already includes admin overrides).
 * Falls back to the collection's pins when the building has no map location.
 */
export function unitMapLocations({
  collectionSlug, buildingSlug, locations, unitCoords,
}: {
  collectionSlug: string;
  buildingSlug?: string;
  locations: MapLocation[];
  unitCoords?: { latitude?: number | null; longitude?: number | null } | null;
}): MapLocation[] {
  const building = buildingSlug ? locations.find((l) => l.collectionSlug === buildingSlug) : undefined;
  const base = building ? [building] : getLocationsForProperty(collectionSlug, locations);
  const lat = unitCoords?.latitude;
  const lng = unitCoords?.longitude;
  if (typeof lat !== 'number' || typeof lng !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lng) || !base.length) {
    return base;
  }
  return [{ ...base[0], coordinates: { lat, lng } }];
}
