import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import type { Map as LeafletMap, Marker } from 'leaflet';
import { mapLocations, type MapLocation } from '../data/locations';
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
}

export default function PropertyMap({ locations = mapLocations, height = '100%', className = '', highlightedSlug }: PropertyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
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
        const marker = L.marker([loc.coordinates.lat, loc.coordinates.lng], { icon: pinIcon() })
          .addTo(map)
          .bindPopup(
            `<div style="font-family:sans-serif;min-width:140px">
              <div style="font-weight:600;font-size:14px;margin-bottom:2px">${loc.name}</div>
              <div style="font-size:12px;color:#666;margin-bottom:8px">${loc.area} · ${loc.postcode}</div>
              <a href="/properties/${loc.collectionSlug}" style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#000;border-bottom:1px solid #000;text-decoration:none">View →</a>
            </div>`,
            { closeButton: false, offset: [0, -6] }
          );

        marker.on('click', () => {
          setActiveLocation(loc);
          // Re-render all marker icons
          markersRef.current.forEach((m, i) => {
            m.setIcon(pinIcon(locations[i]?.id === loc.id));
          });
        });

        markersRef.current.push(marker);
      });

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
  }, [locations]);

  // Fly to location when activeLocation changes externally — not needed but could be used
  useEffect(() => {
    if (!mapRef.current || !activeLocation) return;
    mapRef.current.flyTo([activeLocation.coordinates.lat, activeLocation.coordinates.lng], 15, { duration: 0.8 });
  }, [activeLocation]);

  return (
    <div className={`relative ${className}`} style={{ height }}>
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
