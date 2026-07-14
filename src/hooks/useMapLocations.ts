import { useMemo } from 'react';
import { useSiteContent } from './useSiteContent';
import { buildMapLocations, type MapLocation, type MapLocationOverride } from '../data/locations';

// Reads admin coordinate/postcode overrides from SiteContent (`map.locations`)
// and returns the merged map locations. With no overrides this equals the static
// `mapLocations`, so the map is unchanged until a pin is edited in the admin.
export function useMapLocations(): MapLocation[] {
  const site = useSiteContent();
  return useMemo(() => {
    const raw = site.content['map.locations'];
    const overrides = raw && typeof raw === 'object'
      ? (raw as Record<string, MapLocationOverride>)
      : {};
    return buildMapLocations(overrides);
  }, [site.content]);
}
