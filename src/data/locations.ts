export type LocationArea = 'all' | 'city-centre' | 'deansgate' | 'ancoats' | 'old-trafford';

export type MapLocation = {
  id: number;
  name: string;
  propertySlug: string;
  area: string;
  areaId: Exclude<LocationArea, 'all'>;
  postcode: string;
  coordinates: { lat: number; lng: number };
  position: { top: string; left: string };
};

type DraftMapLocation = Omit<MapLocation, 'position'>;

const manchesterMapBounds = {
  north: 53.493,
  south: 53.456,
  west: -2.3,
  east: -2.215,
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
  { id: 'ancoats', label: 'Ancoats' },
  { id: 'old-trafford', label: 'Old Trafford' },
];

const draftMapLocations: DraftMapLocation[] = [
  {
    id: 1,
    name: 'Chambers Residence',
    propertySlug: 'chambers',
    area: 'Central Manchester',
    areaId: 'city-centre',
    postcode: 'M2 1HN',
    coordinates: { lat: 53.4813, lng: -2.2424 },
  },
  {
    id: 2,
    name: 'John Dalton Street',
    propertySlug: 'john-dalton-st',
    area: 'Deansgate',
    areaId: 'deansgate',
    postcode: 'M2 6DS',
    coordinates: { lat: 53.4801, lng: -2.2478 },
  },
  {
    id: 3,
    name: 'Wood Street',
    propertySlug: 'wood-street',
    area: 'Central Manchester',
    areaId: 'city-centre',
    postcode: 'M3 3EF',
    coordinates: { lat: 53.4792, lng: -2.2527 },
  },
  {
    id: 4,
    name: 'Ancoats',
    propertySlug: 'ancoats',
    area: 'Ancoats',
    areaId: 'ancoats',
    postcode: 'M4 6DU',
    coordinates: { lat: 53.4849, lng: -2.2269 },
  },
  {
    id: 5,
    name: 'Old Trafford',
    propertySlug: 'old-trafford',
    area: 'Old Trafford',
    areaId: 'old-trafford',
    postcode: 'M16 0RA',
    coordinates: { lat: 53.4631, lng: -2.2913 },
  },
  {
    id: 6,
    name: 'The Collective',
    propertySlug: 'the-collective',
    area: 'Central Manchester',
    areaId: 'city-centre',
    postcode: 'M1 3LA',
    coordinates: { lat: 53.477, lng: -2.237 },
  },
];

export const mapLocations: MapLocation[] = draftMapLocations.map((location) => ({
  ...location,
  position: toMapPosition(location.coordinates),
}));
