export type LocationArea = 'all' | 'city-centre' | 'deansgate' | 'ancoats' | 'old-trafford';

export type MapLocation = {
  id: number;
  name: string;
  area: string;
  areaId: Exclude<LocationArea, 'all'>;
  postcode: string | null;
  coordinates: { lat: number; lng: number } | null;
  position: { top: string; left: string };
};

export const locationAreas: { id: LocationArea; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'city-centre', label: 'City Centre' },
  { id: 'deansgate', label: 'Deansgate' },
  { id: 'ancoats', label: 'Ancoats' },
  { id: 'old-trafford', label: 'Old Trafford' },
];

export const mapLocations: MapLocation[] = [
  {
    id: 1,
    name: 'Chambers Residence',
    area: 'Central Manchester',
    areaId: 'city-centre',
    postcode: null,
    coordinates: null,
    position: { top: '40%', left: '45%' },
  },
  {
    id: 2,
    name: 'John Dalton Street',
    area: 'Deansgate',
    areaId: 'deansgate',
    postcode: null,
    coordinates: null,
    position: { top: '60%', left: '30%' },
  },
  {
    id: 3,
    name: 'Wood Street',
    area: 'Central Manchester',
    areaId: 'city-centre',
    postcode: null,
    coordinates: null,
    position: { top: '35%', left: '65%' },
  },
  {
    id: 4,
    name: 'Ancoats',
    area: 'Ancoats',
    areaId: 'ancoats',
    postcode: null,
    coordinates: null,
    position: { top: '75%', left: '55%' },
  },
  {
    id: 5,
    name: 'Old Trafford',
    area: 'Old Trafford',
    areaId: 'old-trafford',
    postcode: null,
    coordinates: null,
    position: { top: '52%', left: '72%' },
  },
  {
    id: 6,
    name: 'The Collective',
    area: 'Central Manchester',
    areaId: 'city-centre',
    postcode: null,
    coordinates: null,
    position: { top: '25%', left: '38%' },
  },
];
