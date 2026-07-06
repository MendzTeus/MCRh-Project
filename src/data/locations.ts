export type LocationArea = 'all' | 'city-centre' | 'deansgate' | 'ancoats' | 'northern-quarter' | 'east-manchester' | 'old-trafford';

export type MapLocation = {
  id: number;
  name: string;
  propertySlug: string;
  collectionSlug: string;
  area: string;
  areaId: Exclude<LocationArea, 'all'>;
  /** Region/building the location belongs to — used to group cards and map pins. */
  groupId: string;
  postcode: string;
  coordinates: { lat: number; lng: number };
  position: { top: string; left: string };
};

type DraftMapLocation = Omit<MapLocation, 'position' | 'groupId'>;

/**
 * Region groups used to organise the home list and to collapse the home map to a
 * single pin per building/area. Order here is the display order on the home page.
 */
export const locationGroups: { id: string; label: string }[] = [
  { id: 'chambers', label: 'Chambers Residence' },
  { id: 'ancoats', label: 'Ancoats' },
  { id: 'john-dalton-street', label: 'John Dalton Street' },
  { id: 'trafford', label: 'Trafford' },
  { id: 'wood-street', label: 'Wood Street' },
];

// Which region group each individual location belongs to (keyed by collectionSlug).
const groupByCollectionSlug: Record<string, string> = {
  'chambers-9': 'chambers',
  'chambers-11': 'chambers',
  'john-dalton-st': 'john-dalton-street',
  'wood-street': 'wood-street',
  'the-collective': 'wood-street',
  'newton-street': 'ancoats',
  'crusader': 'ancoats',
  'loom-street': 'ancoats',
  'lockgate-mews': 'ancoats',
  'sezas': 'ancoats',
  'mm2': 'ancoats',
  'popworks': 'ancoats',
  'spinning-mills': 'ancoats',
  'old-trafford': 'trafford',
};

const manchesterMapBounds = {
  north: 53.495,
  south: 53.456,
  west: -2.305,
  east: -2.200,
};

function toMapPosition({ lat, lng }: MapLocation['coordinates']) {
  const top = ((manchesterMapBounds.north - lat) / (manchesterMapBounds.north - manchesterMapBounds.south)) * 100;
  const left = ((lng - manchesterMapBounds.west) / (manchesterMapBounds.east - manchesterMapBounds.west)) * 100;

  return {
    top: `${Math.min(92, Math.max(8, top))}%`,
    left: `${Math.min(92, Math.max(8, left))}%`,
  };
}

export const manchesterMapEmbedUrl =
  `https://www.openstreetmap.org/export/embed.html?bbox=${manchesterMapBounds.west}%2C${manchesterMapBounds.south}%2C${manchesterMapBounds.east}%2C${manchesterMapBounds.north}&layer=mapnik`;

export const locationAreas: { id: LocationArea; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'city-centre', label: 'City Centre' },
  { id: 'deansgate', label: 'Deansgate' },
  { id: 'northern-quarter', label: 'Northern Quarter' },
  { id: 'ancoats', label: 'Ancoats' },
  { id: 'east-manchester', label: 'East Manchester' },
  { id: 'old-trafford', label: 'Old Trafford' },
];

const draftMapLocations: DraftMapLocation[] = [
  // --- City Centre / Deansgate ---
  {
    id: 1,
    name: '9 Chapel Walks',
    propertySlug: 'chambers-9',
    collectionSlug: 'chambers-9',
    area: 'City Centre',
    areaId: 'city-centre',
    postcode: 'M2 1HN',
    coordinates: { lat: 53.4818, lng: -2.2440 },
  },
  {
    id: 14,
    name: '11 Chapel Walks',
    propertySlug: 'chambers-11',
    collectionSlug: 'chambers-11',
    area: 'City Centre',
    areaId: 'city-centre',
    postcode: 'M2 1HN',
    coordinates: { lat: 53.4817, lng: -2.2443 },
  },
  {
    id: 2,
    name: '42 John Dalton St.',
    propertySlug: 'john-dalton-st',
    collectionSlug: 'john-dalton-st',
    area: 'Deansgate',
    areaId: 'deansgate',
    postcode: 'M2 6LE',
    coordinates: { lat: 53.4802, lng: -2.2458 },
  },
  {
    id: 3,
    name: '18 Wood Street',
    propertySlug: 'wood-street',
    collectionSlug: 'wood-street',
    area: 'City Centre',
    areaId: 'city-centre',
    postcode: 'M3 3EF',
    coordinates: { lat: 53.4807, lng: -2.2496 },
  },
  {
    id: 4,
    name: '20-22 Wood Street',
    propertySlug: 'the-collective',
    collectionSlug: 'the-collective',
    area: 'City Centre',
    areaId: 'city-centre',
    postcode: 'M3 3EF',
    coordinates: { lat: 53.4805, lng: -2.2493 },
  },

  // --- Northern Quarter ---
  {
    id: 5,
    name: '113 Newton Street',
    propertySlug: 'ancoats',
    collectionSlug: 'newton-street',
    area: 'Northern Quarter',
    areaId: 'northern-quarter',
    postcode: 'M1 1AE',
    coordinates: { lat: 53.4835, lng: -2.2312 },
  },
  {
    id: 6,
    name: 'Crusader / Neptune Mill',
    propertySlug: 'ancoats',
    collectionSlug: 'crusader',
    area: 'Northern Quarter',
    areaId: 'northern-quarter',
    postcode: 'M1 2WQ',
    coordinates: { lat: 53.4784, lng: -2.2262 },
  },

  // --- Ancoats & East ---
  {
    id: 7,
    name: 'Loom Street',
    propertySlug: 'ancoats',
    collectionSlug: 'loom-street',
    area: 'Ancoats',
    areaId: 'ancoats',
    postcode: 'M4 6AN',
    coordinates: { lat: 53.4854, lng: -2.2272 },
  },
  {
    id: 8,
    name: 'Lockgate Mews',
    propertySlug: 'ancoats',
    collectionSlug: 'lockgate-mews',
    area: 'Northern Quarter',
    areaId: 'northern-quarter',
    postcode: 'M1 2WA',
    coordinates: { lat: 53.4793, lng: -2.2284 },
  },
  {
    id: 9,
    name: "Seza's",
    propertySlug: 'ancoats',
    collectionSlug: 'sezas',
    area: 'Ancoats',
    areaId: 'ancoats',
    postcode: 'M4 5BR',
    coordinates: { lat: 53.4855, lng: -2.2245 },
  },
  {
    id: 10,
    name: 'MM2',
    propertySlug: 'ancoats',
    collectionSlug: 'mm2',
    area: 'Ancoats',
    areaId: 'ancoats',
    postcode: 'M4 5BS',
    coordinates: { lat: 53.4833, lng: -2.2285 },
  },
  {
    id: 11,
    name: 'PopWorks',
    propertySlug: 'ancoats',
    collectionSlug: 'popworks',
    area: 'Ancoats',
    areaId: 'ancoats',
    postcode: 'M4 6BQ',
    coordinates: { lat: 53.4872, lng: -2.2260 },
  },
  {
    id: 12,
    name: 'Spinning Mills',
    propertySlug: 'ancoats',
    collectionSlug: 'spinning-mills',
    area: 'Miles Platting',
    areaId: 'east-manchester',
    postcode: 'M40 7LJ',
    coordinates: { lat: 53.4897, lng: -2.2143 },
  },

  // --- Old Trafford ---
  {
    id: 13,
    name: 'Insignia',
    propertySlug: 'old-trafford',
    collectionSlug: 'old-trafford',
    area: 'Old Trafford',
    areaId: 'old-trafford',
    postcode: 'M16 0UF',
    coordinates: { lat: 53.4600, lng: -2.2849 },
  },
];

export const mapLocations: MapLocation[] = draftMapLocations.map((location) => ({
  ...location,
  groupId: groupByCollectionSlug[location.collectionSlug] ?? location.areaId,
  position: toMapPosition(location.coordinates),
}));

/**
 * Groups a set of locations into their region groups, preserving `locationGroups`
 * display order. Used to render grouped cards on the home page.
 */
export function getLocationGroups(locations: MapLocation[] = mapLocations) {
  return locationGroups
    .map((group) => ({
      ...group,
      locations: locations.filter((location) => location.groupId === group.id),
    }))
    .filter((group) => group.locations.length > 0);
}

/**
 * Collapses locations to a single synthetic marker per region group (centroid of
 * the group's coordinates). Used so the home map shows one pin per building/area
 * instead of one per individual unit.
 */
export function groupLocationsByRegion(locations: MapLocation[] = mapLocations): MapLocation[] {
  return getLocationGroups(locations).map((group, index) => {
    const items = group.locations;
    const lat = items.reduce((sum, item) => sum + item.coordinates.lat, 0) / items.length;
    const lng = items.reduce((sum, item) => sum + item.coordinates.lng, 0) / items.length;
    const coordinates = { lat, lng };
    return {
      ...items[0],
      id: 10000 + index,
      name: group.label,
      area: group.label,
      coordinates,
      position: toMapPosition(coordinates),
    };
  });
}

// Which map locations belong to a collection/property page. Handles the grouped
// collections (Chambers → 9 & 11 Chapel Walks, Ancoats → its mill buildings) that
// don't share a slug with their individual locations.
const propertyToCollectionSlugs: Record<string, string[]> = {
  chambers: ['chambers-9', 'chambers-11'],
  ancoats: ['newton-street', 'crusader', 'loom-street', 'lockgate-mews', 'sezas', 'mm2', 'popworks', 'spinning-mills'],
};

/**
 * Returns the map locations relevant to a given property/collection slug so each
 * collection map shows only its own pins (never every pin in the city).
 */
export function getLocationsForProperty(propertySlug?: string): MapLocation[] {
  if (!propertySlug) return [];
  const collectionSlugs = propertyToCollectionSlugs[propertySlug];
  if (collectionSlugs) {
    return mapLocations.filter((location) => collectionSlugs.includes(location.collectionSlug));
  }
  return mapLocations.filter(
    (location) => location.collectionSlug === propertySlug || location.propertySlug === propertySlug,
  );
}

export function getPropertyMapEmbedUrl(collectionSlug: string): string | null {
  const loc = draftMapLocations.find((l) => l.collectionSlug === collectionSlug);
  if (!loc) return null;
  const { lat, lng } = loc.coordinates;
  const delta = 0.007;
  const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
}
