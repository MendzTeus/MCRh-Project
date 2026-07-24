import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import type { Map as LeafletMap, Layer } from 'leaflet';
import { mapLocations, type MapLocation } from '../data/locations';
import type { Poi } from '../data/pois';
import { Link } from 'react-router-dom';
import { useState } from 'react';

// Fix default marker icon broken in bundlers
function fixLeafletIcons(L: typeof import('leaflet')) {
  // @ts-expect-error leaflet private
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

interface PropertyMapProps {
  locations?: MapLocation[];
  height?: string;
  className?: string;
  highlightedSlug?: string;
  /** Coordinates to fly to when they change — used to focus the map from an
   *  external card click without navigating. */
  focusedCoords?: { lat: number; lng: number } | null;
  /** Render each location as a soft area circle instead of a precise pin, so the
   *  exact address stays private (used on the home "Discover Our Locations" map). */
  areaCircles?: boolean;
  /** Nearby landmarks to plot with a distinct pin style (used on the per-property
   *  "Neighborhood" map). Included in the fitted bounds so they stay in view. */
  pois?: Poi[];
}

export default function PropertyMap({ locations = mapLocations, height = '100%', className = '', highlightedSlug, focusedCoords, areaCircles = false, pois = [] }: PropertyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Layer[]>([]);
  const [activeLocation, setActiveLocation] = useState<MapLocation | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let map: LeafletMap | undefined;

    import('leaflet').then((L) => {
      // Re-check after the async import: under StrictMode the effect can run twice
      // before this resolves, and we must not initialize the container twice.
      if (!containerRef.current || mapRef.current) return;
      fixLeafletIcons(L);

      map = L.map(containerRef.current!, {
        center: [53.479, -2.244],
        zoom: 14,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
      }).addTo(map);

      // Custom dark pin icon
      const pinIcon = (active = false) =>
        L.divIcon({
          className: '',
          html: `<div style="
            width:${active ? 18 : 14}px;
            height:${active ? 18 : 14}px;
            background:#000;
            border-radius:50%;
            border:2px solid #fff;
            box-shadow:0 2px 8px rgba(0,0,0,0.35);
            transition:transform 0.2s;
            transform:${active ? 'scale(1.3)' : 'scale(1)'};
          "></div>`,
          iconSize: [active ? 18 : 14, active ? 18 : 14],
          iconAnchor: [active ? 9 : 7, active ? 9 : 7],
        });

      locations.forEach((loc) => {
        const layer = areaCircles
          ? L.circle([loc.coordinates.lat, loc.coordinates.lng], {
              radius: 320,
              color: '#000',
              weight: 1,
              opacity: 0.45,
              fillColor: '#000',
              fillOpacity: 0.1,
            })
          : L.marker([loc.coordinates.lat, loc.coordinates.lng], { icon: pinIcon() });

        layer
          .addTo(map)
          .bindPopup(
            `<div style="font-family:sans-serif;min-width:140px">
              <div style="font-weight:600;font-size:14px;margin-bottom:2px">${loc.name}</div>
              <div style="font-size:12px;color:#666;margin-bottom:8px">${loc.area} · ${loc.postcode}</div>
              <a href="/properties/${loc.collectionSlug}" style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#000;border-bottom:1px solid #000;text-decoration:none">View →</a>
            </div>`,
            { closeButton: false, offset: [0, -6] }
          );

        layer.on('click', () => {
          setActiveLocation(loc);
          // Re-render marker icons to reflect the active pin (circles need no icon swap).
          if (!areaCircles) {
            markersRef.current.forEach((m, i) => {
              (m as import('leaflet').Marker).setIcon(pinIcon(locations[i]?.id === loc.id));
            });
          }
        });

        markersRef.current.push(layer);
      });

      // Nearby landmarks — a distinct blue pin so guests don't mistake a POI for a
      // rental. Rendered beneath property pins via a negative z-index offset.
      const poiIcon = L.divIcon({
        className: '',
        html: `<div style="
          width:11px;height:11px;background:#2563eb;border-radius:50%;
          border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.35);
        "></div>`,
        iconSize: [11, 11],
        iconAnchor: [5.5, 5.5],
      });
      pois.forEach((poi) => {
        L.marker([poi.coordinates.lat, poi.coordinates.lng], { icon: poiIcon, zIndexOffset: -500 })
          .addTo(map!)
          .bindTooltip(poi.name, { direction: 'top', offset: [0, -6] })
          .bindPopup(
            `<div style="font-family:sans-serif;min-width:120px">
              <div style="font-weight:600;font-size:13px;margin-bottom:2px">${poi.name}</div>
              <div style="font-size:12px;color:#666">${poi.postcode}</div>
            </div>`,
            { closeButton: false, offset: [0, -6] }
          );
      });

      // Frame the relevant pins: a single location (with no POIs) gets a close-up;
      // otherwise fit every property pin and nearby landmark so the map focuses on
      // its own context.
      const framePoints: [number, number][] = [
        ...locations.map((loc) => [loc.coordinates.lat, loc.coordinates.lng] as [number, number]),
        ...pois.map((poi) => [poi.coordinates.lat, poi.coordinates.lng] as [number, number]),
      ];
      if (framePoints.length === 1) {
        map.setView(framePoints[0], 15);
      } else if (framePoints.length > 1) {
        map.fitBounds(L.latLngBounds(framePoints), { padding: [48, 48], maxZoom: 15 });
      }

      mapRef.current = map;
    });

    return () => {
      const created = mapRef.current ?? map;
      if (created) {
        created.remove();
        mapRef.current = null;
        markersRef.current = [];
      }
    };
    // `pois` is intentionally omitted: it's rendered once on init and, for the
    // callers that pass it, is memoised. Including the default `[]` here would make
    // a new reference every render, tearing down and rebuilding the whole map
    // (which cancelled the focus flyTo mid-animation).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locations]);

  // Fly to location when activeLocation changes externally — not needed but could be used
  useEffect(() => {
    if (!mapRef.current || !activeLocation) return;
    mapRef.current.flyTo([activeLocation.coordinates.lat, activeLocation.coordinates.lng], 15, { duration: 0.8 });
  }, [activeLocation]);

  // Fly to coordinates supplied by a parent (e.g. a card click) so selecting a
  // location zooms the map to it instead of navigating away.
  useEffect(() => {
    if (!mapRef.current || !focusedCoords) return;
    mapRef.current.flyTo([focusedCoords.lat, focusedCoords.lng], 15, { duration: 0.8 });
  }, [focusedCoords]);

  return (
    <div className={`relative isolate ${className}`} style={{ height }}>
      <div ref={containerRef} className="w-full h-full" />
      {activeLocation && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-white rounded-xl shadow-lg border border-outline-variant/30 px-5 py-4 max-w-[220px]">
          <p className="font-body text-label-caps text-secondary tracking-widest uppercase text-xs mb-1">{activeLocation.area}</p>
          <p className="font-display text-lg text-primary leading-tight mb-3">{activeLocation.name}</p>
          <Link
            to={`/properties/${activeLocation.collectionSlug}`}
            className="font-body text-label-caps text-xs tracking-widest uppercase text-primary border-b border-primary pb-0.5 hover:text-secondary hover:border-secondary transition-colors"
          >
            Explore →
          </Link>
        </div>
      )}
    </div>
  );
}
