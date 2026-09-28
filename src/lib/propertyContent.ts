import type { NearbyPlace, Property } from '../data/properties';
import { getLocationsForProperty, type MapLocation } from '../data/locations';

// ── Collection content edited in the admin (SiteContent `property.<slug>.*`) ──
// The static data in properties.ts stays the default; a saved, non-empty
// admin value replaces it. Empty values (blank rows, 0/blank numbers) are
// ignored so a half-filled form can never blank out part of a page.

export type PropertySpecsOverride = { maxGuests?: number; bedrooms?: number; beds?: number; bathrooms?: number };

const positiveInt = (n: unknown) => (typeof n === 'number' && Number.isInteger(n) && n > 0 ? n : undefined);
const nonEmpty = (s: unknown) => (typeof s === 'string' && s.trim() ? s : undefined);

export function propertyContentKeys(slug: string) {
  return {
    headline: `property.${slug}.headline`,
    amenities: `property.${slug}.amenities`,
    nearby: `property.${slug}.nearby`,
    specs: `property.${slug}.specs`,
  };
}

export function applyPropertyContent(property: Property, content: Record<string, unknown>): Property {
  const keys = propertyContentKeys(property.slug);
  const next: Property = { ...property };

  const headline = nonEmpty(content[keys.headline]);
  if (headline) next.headline = headline;

  const amenityRows = content[keys.amenities];
  if (Array.isArray(amenityRows)) {
    const amenities = amenityRows.map((r) => nonEmpty((r as { item?: unknown })?.item)).filter((a): a is string => Boolean(a));
    if (amenities.length) next.amenities = amenities;
  }

  const nearbyRows = content[keys.nearby];
  if (Array.isArray(nearbyRows)) {
    const distances = nearbyRows
      .map((r) => ({ location: nonEmpty((r as NearbyPlace)?.location), time: nonEmpty((r as NearbyPlace)?.time) }))
      .filter((r): r is NearbyPlace => Boolean(r.location && r.time));
    if (distances.length) next.distances = distances;
  }

  const specs = content[keys.specs];
  if (specs && typeof specs === 'object') {
    const s = specs as PropertySpecsOverride;
    next.maxGuests = positiveInt(s.maxGuests) ?? next.maxGuests;
    next.bedrooms = positiveInt(s.bedrooms) ?? next.bedrooms;
    next.beds = positiveInt(s.beds) ?? next.beds;
    next.bathrooms = positiveInt(s.bathrooms) ?? next.bathrooms;
  }

  return next;
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
