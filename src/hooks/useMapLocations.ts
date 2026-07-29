import { useMemo } from 'react';
import { useSiteContent } from './useSiteContent';
import { usePublicProperties } from './usePublicProperties';
import { buildMapLocations, type MapLocation, type MapLocationOverride } from '../data/locations';

// Reads coordinate/postcode overrides from SiteContent (`map.locations`) and
// overlays the canonical public Property name/area. Structural identifiers
// remain stable when an editor changes a building's public-facing name.
export function useMapLocations(): MapLocation[] {
  const site = useSiteContent();
  const publicProperties = usePublicProperties();

  return useMemo(() => {
    const raw = site.content['map.locations'];
    const overrides = raw && typeof raw === 'object'
      ? (raw as Record<string, MapLocationOverride>)
      : {};
    return buildMapLocations(overrides).map((location) => {
      const property = publicProperties.bySlug.get(location.collectionSlug);
      if (!property) return location;
      return {
        ...location,
        name: property.name,
        area: property.area || location.area,
      };
    });
  }, [site.content, publicProperties.bySlug]);
}
