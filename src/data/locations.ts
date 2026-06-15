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
    name: 'Chapel Walks',
    propertySlug: 'chambers',
    collectionSlug: 'chambers',
    area: 'City Centre',
    areaId: 'city-centre',
    postcode: 'M2 1HN',
    coordinates: { lat: 53.4813, lng: -2.2424 },
  },
  {
    id: 2,
    name: 'John Dalton Street',
    propertySlug: 'john-dalton-st',
    collectionSlug: 'john-dalton-st',
    area: 'Deansgate',
    areaId: 'deansgate',
    postcode: 'M2 6LE',
    coordinates: { lat: 53.4801, lng: -2.2478 },
  },
  {
    id: 3,
    name: 'Wood Street',
    propertySlug: 'wood-street',
    collectionSlug: 'wood-street',
    area: 'City Centre',
    areaId: 'city-centre',
    postcode: 'M3 3EF',
    coordinates: { lat: 53.4792, lng: -2.2527 },
  },
  {
    id: 4,
    name: 'Wood Street Collective',
    propertySlug: 'the-collective',
    collectionSlug: 'the-collective',
    area: 'City Centre',
    areaId: 'city-centre',
    postcode: 'M3 3EF',
    coordinates: { lat: 53.4795, lng: -2.2520 },
  },

  // --- Northern Quarter ---
  {
    id: 5,
    name: 'Newton Street',
    propertySlug: 'ancoats',
    collectionSlug: 'newton-street',
    area: 'Northern Quarter',
    areaId: 'northern-quarter',
    postcode: 'M1 1AE',
    coordinates: { lat: 53.4838, lng: -2.2352 },
  },
  {
    id: 6,
    name: 'Crusader',
    propertySlug: 'ancoats',
    collectionSlug: 'crusader',
    area: 'Northern Quarter',
    areaId: 'northern-quarter',
    postcode: 'M1 2WQ',
    coordinates: { lat: 53.4815, lng: -2.2330 },
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
    coordinates: { lat: 53.4843, lng: -2.2215 },
  },
  {
    id: 8,
    name: 'Lockgate Mews',
    propertySlug: 'ancoats',
    collectionSlug: 'lockgate-mews',
    area: 'Ancoats',
    areaId: 'ancoats',
    postcode: 'M4 6GE',
    coordinates: { lat: 53.4866, lng: -2.2188 },
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
    coordinates: { lat: 53.4852, lng: -2.2240 },
  },
  {
    id: 11,
    name: 'PopWorks',
    propertySlug: 'ancoats',
    collectionSlug: 'popworks',
    area: 'Ancoats',
    areaId: 'ancoats',
    postcode: 'M4 6BQ',
    coordinates: { lat: 53.4860, lng: -2.2210 },
  },
  {
    id: 12,
    name: 'Spinning Mills',
    propertySlug: 'ancoats',
    collectionSlug: 'spinning-mills',
    area: 'East Manchester',
    areaId: 'east-manchester',
    postcode: 'M40 7LY',
    coordinates: { lat: 53.4905, lng: -2.2080 },
  },

  // --- Old Trafford ---
  {
    id: 13,
    name: 'Insignia',
    propertySlug: 'old-trafford',
    collectionSlug: 'old-trafford',
    area: 'Old Trafford',
    areaId: 'old-trafford',
    postcode: 'M16 0PG',
    coordinates: { lat: 53.4631, lng: -2.2913 },
  },
];

export const mapLocations: MapLocation[] = draftMapLocations.map((location) => ({
  ...location,
  position: toMapPosition(location.coordinates),
}));
