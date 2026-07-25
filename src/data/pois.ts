// Points of interest shown on the Properties map (and reused for the per-property
// "Neighborhood" map). Styled distinctly from property pins so guests don't
// confuse a landmark with a rental. Coordinates are approximate landmark centres.
export type Poi = {
  name: string;
  category: string;
  postcode: string;
  coordinates: { lat: number; lng: number };
};

export const pois: Poi[] = [
  { name: 'Manchester Piccadilly Station', category: 'Train Station', postcode: 'M60 7RA', coordinates: { lat: 53.4774, lng: -2.2309 } },
  { name: 'Manchester Victoria Station', category: 'Train Station', postcode: 'M3 1WY', coordinates: { lat: 53.4875, lng: -2.2426 } },
  { name: "St Peter's Square", category: 'Square & Tram Stop', postcode: 'M2 5PD', coordinates: { lat: 53.4785, lng: -2.2452 } },
  { name: 'Manchester Airport', category: 'Airport', postcode: 'M90 1QX', coordinates: { lat: 53.3650, lng: -2.2727 } },
  { name: 'Old Trafford – Man Utd Stadium', category: 'Stadium', postcode: 'M16 0RA', coordinates: { lat: 53.4631, lng: -2.2913 } },
  { name: 'Etihad Stadium – Man City', category: 'Stadium', postcode: 'M11 3FF', coordinates: { lat: 53.4831, lng: -2.2004 } },
  { name: 'AO Arena', category: 'Arena', postcode: 'M3 1AR', coordinates: { lat: 53.4880, lng: -2.2436 } },
  { name: 'Co-op Live', category: 'Arena', postcode: 'M11 3DL', coordinates: { lat: 53.4842, lng: -2.1949 } },
  { name: 'Manchester Arndale', category: 'Shopping Centre', postcode: 'M4 3AQ', coordinates: { lat: 53.4839, lng: -2.2380 } },
  { name: 'Trafford Centre', category: 'Shopping Centre', postcode: 'M17 8AA', coordinates: { lat: 53.4668, lng: -2.3487 } },
  { name: 'National Football Museum', category: 'Museum', postcode: 'M4 3BG', coordinates: { lat: 53.4859, lng: -2.2418 } },
  { name: 'Science & Industry Museum', category: 'Museum', postcode: 'M3 4FP', coordinates: { lat: 53.4769, lng: -2.2549 } },
  { name: 'MediaCity', category: 'Media & Business', postcode: 'M50 2EQ', coordinates: { lat: 53.4727, lng: -2.2986 } },
  { name: 'Cutting Room Square – Ancoats', category: 'Café Quarter', postcode: 'M4 6BF', coordinates: { lat: 53.4841, lng: -2.2276 } },
];

function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Nearest POIs to a coordinate, closest first — used by the per-property map. */
export function getNearestPois(coordinates: { lat: number; lng: number }, limit = 6): Poi[] {
  return [...pois]
    .sort((a, b) => haversine(a.coordinates, coordinates) - haversine(b.coordinates, coordinates))
    .slice(0, limit);
}
