export type LocationArea = 'all' | 'city-centre' | 'deansgate' | 'ancoats' | 'northern-quarter' | 'east-manchester' | 'old-trafford';

export type MapLocation = {
  id: number;
  name: string;
  propertySlug: string;
  collectionSlug: string;
  area: string;
  areaId: Exclude<LocationArea, 'all'>;
  postcode: string;
  coordinates: { lat: number; lng: number };
  position: { top: string; left: string };
};

type DraftMapLocation = Omit<MapLocation, 'position'>;

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
  position: toMapPosition(location.coordinates),
}));

export function getPropertyMapEmbedUrl(collectionSlug: string): string | null {
  const loc = draftMapLocations.find((l) => l.collectionSlug === collectionSlug);
  if (!loc) return null;
  const { lat, lng } = loc.coordinates;
  const delta = 0.007;
  const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
}
