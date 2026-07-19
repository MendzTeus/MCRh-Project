import 'leaflet/dist/leaflet.css';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar, User, SlidersHorizontal, ArrowUpDown, Heart, Bed, Bath, Plus, Minus, X } from 'lucide-react';
import { mapLocations } from '../data/locations';
import { airbnbInventory, inventoryRegions, getRegionForProperty, type AirbnbInventoryUnit } from '../data/airbnbInventory';
import { getListingMedia, getPropertyMedia } from '../data/listingMedia';
import { usePublicUnits } from '../hooks/usePublicUnits';
import { useSiteContent, text } from '../hooks/useSiteContent';
import DateRangePicker from '../components/DateRangePicker';

function specsToNumbers(specs?: string) {
  if (!specs) return { beds: 1, baths: 1 };
  const bedMatch = specs.match(/(\d+)BED/);
  const bathMatch = specs.match(/(\d+)BATH/);
  return { beds: bedMatch ? parseInt(bedMatch[1]) : 1, baths: bathMatch ? parseInt(bathMatch[1]) : 1 };
}

function groupByProperty(units: AirbnbInventoryUnit[]) {
  const groups: { propertyName: string; propertySlug: string; units: AirbnbInventoryUnit[] }[] = [];
  const seen: Record<string, number> = {};
  units.forEach((unit) => {
    if (seen[unit.propertyName] === undefined) {
      seen[unit.propertyName] = groups.length;
      groups.push({ propertyName: unit.propertyName, propertySlug: unit.propertySlug, units: [] });
    }
    groups[seen[unit.propertyName]].units.push(unit);
  });
  return groups;
}

function PropertiesMap({
  focusedPropertySlug,
  onMarkerClick,
}: {
  focusedPropertySlug: string | null;
  onMarkerClick?: (collectionSlug: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const onMarkerClickRef = useRef(onMarkerClick);
  onMarkerClickRef.current = onMarkerClick;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let map: any;
    import('leaflet').then((L) => {
      // Re-check after the async import so StrictMode's double-run can't
      // initialize the same container twice.
      if (!containerRef.current || mapRef.current) return;
      // @ts-expect-error private
      delete L.Icon.Default.prototype._getIconUrl;
      map = L.map(containerRef.current, {
        center: [53.479, -2.244], zoom: 13,
        zoomControl: false, scrollWheelZoom: true,
      });
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© CARTO', maxZoom: 19,
      }).addTo(map);

      const makeIcon = (name: string, active = false) => L.divIcon({
        className: '',
        html: `<div style="background:${active ? '#C8A45C' : '#1c1c18'};color:#fff;font-size:11px;font-weight:600;padding:4px 9px;border-radius:4px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-family:sans-serif;position:relative;cursor:pointer;">${name}<div style="position:absolute;bottom:-5px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:5px solid ${active ? '#C8A45C' : '#1c1c18'};"></div></div>`,
        iconSize: [100, 28], iconAnchor: [50, 33],
      });

      mapLocations.forEach((loc) => {
        const marker = L.marker([loc.coordinates.lat, loc.coordinates.lng], { icon: makeIcon(loc.name) })
          .addTo(map)
          .bindPopup(
            `<div style="font-family:sans-serif;min-width:140px"><b style="font-size:14px">${loc.name}</b><br/><span style="font-size:12px;color:#666">${loc.area} · ${loc.postcode}</span></div>`,
            { closeButton: false, offset: [0, -6] }
          );

        marker.on('click', () => {
          onMarkerClickRef.current?.(loc.collectionSlug);
        });

        markersRef.current[loc.collectionSlug] = {
          marker,
          lat: loc.coordinates.lat,
          lng: loc.coordinates.lng,
          makeIcon: (a: boolean) => makeIcon(loc.name, a),
        };
      });

      map.invalidateSize();
      mapRef.current = map;
    });
    return () => {
      const created = mapRef.current ?? map;
      if (created) { created.remove(); mapRef.current = null; markersRef.current = {}; }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !Object.keys(markersRef.current).length) return;
    // Reset every marker to its default look and stacking order.
    Object.values(markersRef.current).forEach((v: any) => {
      v.marker.setIcon(v.makeIcon(false));
      v.marker.setZIndexOffset(0);
    });
    if (!focusedPropertySlug) return;
    const entry = markersRef.current[focusedPropertySlug];
    if (!entry) return;
    // Highlight, lift above overlapping labels, and zoom in on the location.
    entry.marker.setIcon(entry.makeIcon(true));
    entry.marker.setZIndexOffset(1000);
    mapRef.current.flyTo([entry.lat, entry.lng], 16, { animate: true, duration: 0.6 });
  }, [focusedPropertySlug]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', isolation: 'isolate' }}>
      <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 500, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button onClick={() => mapRef.current?.zoomIn()} style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(197,198,205,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Plus style={{ width: 16, height: 16 }} /></button>
        <button onClick={() => mapRef.current?.zoomOut()} style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(197,198,205,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Minus style={{ width: 16, height: 16 }} /></button>
      </div>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}

function useIsMobile() {
  const [mobile, setMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return mobile;
}

const SORT_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'name', label: 'Name A → Z' },
  { value: 'beds-asc', label: 'Beds: Low → High' },
  { value: 'beds-desc', label: 'Beds: High → Low' },
] as const;

export default function Properties() {
  const isMobile = useIsMobile();
  const publicUnits = usePublicUnits();
  const site = useSiteContent();
  const [datesOpen, setDatesOpen] = useState(false);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [guestsOpen, setGuestsOpen] = useState(false);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [focusedPropertySlug, setFocusedPropertySlug] = useState<string | null>(null);
  const [availability, setAvailability] = useState<Record<string, boolean> | null>(null);
  const [availLoading, setAvailLoading] = useState(false);
  const [showMobileMap, setShowMobileMap] = useState(false);

  // Sort + Filter
  const [sortBy, setSortBy] = useState<'default' | 'name' | 'beds-asc' | 'beds-desc'>('default');
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterMinBeds, setFilterMinBeds] = useState(0);
  const [filterRegion, setFilterRegion] = useState<string | null>(null);
  const [filterAvailOnly, setFilterAvailOnly] = useState(false);

  // Refs for scrolling to groups from map click
  const groupRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const leftColRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!checkIn || !checkOut) { setAvailability(null); return; }
    let cancelled = false;
    setAvailLoading(true);
    const slugs = airbnbInventory.map((u) => u.unitSlug).join(',');
    fetch(`/api/availability/units?unitSlugs=${encodeURIComponent(slugs)}&checkIn=${checkIn}&checkOut=${checkOut}`)
      .then((r) => r.json())
      .then((data) => { if (!cancelled) setAvailability(data.units || null); })
      .catch(() => { if (!cancelled) setAvailability(null); })
      .finally(() => { if (!cancelled) setAvailLoading(false); });
    // Drop a stale response if the dates change before it lands.
    return () => { cancelled = true; };
  }, [checkIn, checkOut]);

  // When map marker clicked: focus + scroll left column to that group
  function handleMarkerClick(collectionSlug: string) {
    if (focusedPropertySlug === collectionSlug) {
      setFocusedPropertySlug(null);
      return;
    }
    setFocusedPropertySlug(collectionSlug);
    const el = groupRefs.current[collectionSlug];
    if (el) {
      // Account for sticky nav (80px) + sticky filter header (~160px)
      const top = el.getBoundingClientRect().top + window.scrollY - 260;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }

  const dateLabel = checkIn && checkOut
    ? `${new Date(checkIn + 'T00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${new Date(checkOut + 'T00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
    : 'Dates';

  // Layer DB state over the static inventory: drop hidden apartments and apply
  // admin edits (name / specs / airbnb link). Falls back to static untouched
  // while the overlay is loading or if the API is unreachable.
  const overlaidGroups = useMemo(() => {
    const inv = airbnbInventory
      .filter((u) => !publicUnits.hidden.has(u.unitSlug))
      .map((u) => {
        const o = publicUnits.overrides.get(u.unitSlug);
        return o ? { ...u, unitName: o.unitName || u.unitName, suppliedSpecs: o.suppliedSpecs || u.suppliedSpecs, airbnbUrl: o.airbnbUrl || u.airbnbUrl } : u;
      });
    return groupByProperty(inv);
  }, [publicUnits]);

  // Apply filter then sort
  const displayedGroups = useMemo(() => {
    let groups = overlaidGroups
      .filter((g) => !filterRegion || getRegionForProperty(g.propertySlug) === filterRegion)
      .map((g) => ({
      ...g,
      units: g.units.filter((unit) => {
        const { beds } = specsToNumbers(unit.suppliedSpecs);
        if (filterMinBeds > 0 && beds < filterMinBeds) return false;
        if (filterAvailOnly && availability && availability[unit.unitSlug] === false) return false;
        return true;
      }),
    })).filter((g) => g.units.length > 0);

    if (sortBy === 'name') {
      groups = [...groups].sort((a, b) => a.propertyName.localeCompare(b.propertyName));
    } else if (sortBy === 'beds-asc') {
      groups = [...groups].sort((a, b) => {
        const aMin = Math.min(...a.units.map((u) => specsToNumbers(u.suppliedSpecs).beds));
        const bMin = Math.min(...b.units.map((u) => specsToNumbers(u.suppliedSpecs).beds));
        return aMin - bMin;
      });
    } else if (sortBy === 'beds-desc') {
      groups = [...groups].sort((a, b) => {
        const aMax = Math.max(...a.units.map((u) => specsToNumbers(u.suppliedSpecs).beds));
        const bMax = Math.max(...b.units.map((u) => specsToNumbers(u.suppliedSpecs).beds));
        return bMax - aMax;
      });
    }
    return groups;
  }, [overlaidGroups, sortBy, filterMinBeds, filterRegion, filterAvailOnly, availability]);

  const totalDisplayed = displayedGroups.reduce((sum, g) => sum + g.units.length, 0);
  const hasActiveFilters = filterMinBeds > 0 || filterRegion !== null || filterAvailOnly;
  const sortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? 'Sort';

  return (
    <>
      <Helmet>
        <title>{text(site.content, 'seo.properties.title', 'Properties | MCRh Manchester Short-Let Apartments')}</title>
        <meta name="description" content={text(site.content, 'seo.properties.description', "Browse MCRh's curated portfolio of short-let apartments in Manchester.")} />
      </Helmet>

      <div style={{ display: 'flex', alignItems: 'flex-start', marginTop: 80 }}>

        {/* ── Left: scrolls with page ── */}
        <div ref={leftColRef} style={{ width: isMobile ? '100%' : '55%', flexShrink: 0, borderRight: isMobile ? 'none' : '1px solid rgba(197,198,205,0.3)', background: '#fdf9f3' }}>

          {/* Sticky filter header */}
          <div style={{ position: 'sticky', top: 80, zIndex: 20, background: '#fdf9f3', borderBottom: '1px solid rgba(197,198,205,0.2)', padding: isMobile ? '16px 16px 12px' : '24px 24px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h1 className="font-display text-headline-md text-primary">{text(site.content, 'properties.title', 'Find Property')}</h1>
              {isMobile && (
                <button onClick={() => setShowMobileMap((v) => !v)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: '1px solid rgba(197,198,205,0.5)', borderRadius: 8, background: showMobileMap ? '#1c1c18' : 'transparent', color: showMobileMap ? '#fff' : '#1c1c18', cursor: 'pointer', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em' }}>
                  {showMobileMap ? 'List' : 'Map'}
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <button onClick={() => { setDatesOpen(true); setGuestsOpen(false); setSortOpen(false); setFilterOpen(false); }} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', border: `1px solid ${checkIn && checkOut ? '#1c1c18' : 'rgba(197,198,205,0.5)'}`, borderRadius: 8, background: 'transparent', cursor: 'pointer', fontSize: 14 }}>
                <span className="font-body text-on-surface-variant">{dateLabel}</span>
                <Calendar style={{ width: 16, height: 16, color: '#44474c' }} />
              </button>
              <div style={{ position: 'relative' }}>
                <button onClick={() => { setGuestsOpen((o) => !o); setDatesOpen(false); setSortOpen(false); setFilterOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', border: '1px solid rgba(197,198,205,0.5)', borderRadius: 8, background: 'transparent', cursor: 'pointer', fontSize: 14, width: 130 }}>
                  <span className="font-body text-on-surface-variant">{guests === 2 ? 'Guests' : `${guests} Guests`}</span>
                  <User style={{ width: 16, height: 16, color: '#44474c', marginLeft: 'auto' }} />
                </button>
                {guestsOpen && (
                  <div style={{ position: 'absolute', left: 0, top: 'calc(100% + 8px)', background: '#fdf9f3', border: '1px solid rgba(197,198,205,0.3)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: 16, zIndex: 30, width: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="font-body text-sm text-primary">Guests</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button onClick={() => setGuests((v) => Math.max(1, v - 1))} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(197,198,205,0.5)', background: 'transparent', cursor: 'pointer', fontSize: 18 }}>-</button>
                        <span className="font-body text-sm">{guests}</span>
                        <button onClick={() => setGuests((v) => Math.min(16, v + 1))} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(197,198,205,0.5)', background: 'transparent', cursor: 'pointer', fontSize: 18 }}>+</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sort + Filter row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {/* Sort button + dropdown */}
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => { setSortOpen((o) => !o); setFilterOpen(false); setGuestsOpen(false); }}
                    className="font-body text-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: sortBy !== 'default' ? '#1c1c18' : 'none', color: sortBy !== 'default' ? '#fff' : '#44474c', border: sortBy !== 'default' ? 'none' : 'none', padding: '4px 10px 4px 4px', borderRadius: 6, cursor: 'pointer' }}
                  >
                    <ArrowUpDown style={{ width: 14, height: 14 }} />
                    {sortBy !== 'default' ? sortLabel : 'Sort'}
                    {sortBy !== 'default' && (
                      <span onClick={(e) => { e.stopPropagation(); setSortBy('default'); }} style={{ marginLeft: 4, opacity: 0.7 }}>×</span>
                    )}
                  </button>
                  {sortOpen && (
                    <div style={{ position: 'absolute', left: 0, top: 'calc(100% + 6px)', background: '#fdf9f3', border: '1px solid rgba(197,198,205,0.3)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 30, minWidth: 180, overflow: 'hidden' }}>
                      {SORT_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => { setSortBy(opt.value); setSortOpen(false); }}
                          className="font-body text-sm"
                          style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 16px', background: sortBy === opt.value ? 'rgba(28,28,24,0.06)' : 'transparent', border: 'none', cursor: 'pointer', color: '#1c1c18', fontWeight: sortBy === opt.value ? 600 : 400 }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Filter button + panel */}
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => { setFilterOpen((o) => !o); setSortOpen(false); setGuestsOpen(false); }}
                    className="font-body text-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: hasActiveFilters ? '#1c1c18' : 'none', color: hasActiveFilters ? '#fff' : '#44474c', padding: '4px 10px 4px 4px', borderRadius: 6, cursor: 'pointer', border: 'none' }}
                  >
                    <SlidersHorizontal style={{ width: 14, height: 14 }} />
                    Filters
                    {hasActiveFilters && (
                      <span onClick={(e) => { e.stopPropagation(); setFilterMinBeds(0); setFilterRegion(null); setFilterAvailOnly(false); }} style={{ marginLeft: 4, opacity: 0.7 }}>×</span>
                    )}
                  </button>
                  {filterOpen && (
                    <div style={{ position: 'absolute', left: 0, top: 'calc(100% + 6px)', background: '#fdf9f3', border: '1px solid rgba(197,198,205,0.3)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 30, width: 240, padding: 16 }}>
                      <div style={{ marginBottom: 16 }}>
                        <p className="font-body text-xs text-on-surface-variant" style={{ marginBottom: 8, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>Min. Bedrooms</p>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {[0, 1, 2, 3, 4].map((n) => (
                            <button
                              key={n}
                              onClick={() => setFilterMinBeds(n)}
                              className="font-body text-sm"
                              style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${filterMinBeds === n ? '#1c1c18' : 'rgba(197,198,205,0.5)'}`, background: filterMinBeds === n ? '#1c1c18' : 'transparent', color: filterMinBeds === n ? '#fff' : '#1c1c18', cursor: 'pointer', fontWeight: 500 }}
                            >
                              {n === 0 ? 'Any' : n === 4 ? '4+' : n}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div style={{ marginBottom: 16 }}>
                        <p className="font-body text-xs text-on-surface-variant" style={{ marginBottom: 8, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>Location</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {[null, ...inventoryRegions].map((region) => {
                            const active = filterRegion === region;
                            const label = region ?? 'Any';
                            return (
                              <button
                                key={label}
                                onClick={() => setFilterRegion(region)}
                                className="font-body text-sm"
                                style={{ padding: '6px 12px', borderRadius: 999, border: `1px solid ${active ? '#1c1c18' : 'rgba(197,198,205,0.5)'}`, background: active ? '#1c1c18' : 'transparent', color: active ? '#fff' : '#1c1c18', cursor: 'pointer', fontWeight: 500 }}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      {availability && (
                        <div>
                          <button
                            onClick={() => setFilterAvailOnly((v) => !v)}
                            className="font-body text-sm"
                            style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', color: '#1c1c18', padding: 0 }}
                          >
                            <div style={{ width: 18, height: 18, borderRadius: 4, border: `1px solid ${filterAvailOnly ? '#1c1c18' : 'rgba(197,198,205,0.7)'}`, background: filterAvailOnly ? '#1c1c18' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {filterAvailOnly && <X style={{ width: 10, height: 10, color: '#fff' }} />}
                            </div>
                            Available only
                          </button>
                        </div>
                      )}
                      <button
                        onClick={() => { setFilterMinBeds(0); setFilterRegion(null); setFilterAvailOnly(false); setFilterOpen(false); }}
                        className="font-body text-xs"
                        style={{ marginTop: 16, width: '100%', padding: '8px 0', border: '1px solid rgba(197,198,205,0.4)', borderRadius: 6, background: 'transparent', cursor: 'pointer', color: '#44474c' }}
                      >
                        Clear filters
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <span className="font-body text-label-caps text-on-surface-variant uppercase tracking-widest" style={{ fontSize: 11 }}>
                {totalDisplayed} Apartment{totalDisplayed !== 1 ? 's' : ''} Found
              </span>
            </div>
          </div>

          {/* Mobile map */}
          {isMobile && showMobileMap && (
            <div style={{ height: 320, borderBottom: '1px solid rgba(197,198,205,0.3)' }}>
              <PropertiesMap focusedPropertySlug={focusedPropertySlug} onMarkerClick={handleMarkerClick} />
            </div>
          )}

          {/* Grouped cards */}
          <div style={{ padding: isMobile ? '0 12px 24px' : '0 24px 24px', background: '#f7f3ed', display: isMobile && showMobileMap ? 'none' : 'block' }}>
            {availLoading && checkIn && checkOut && (
              <div style={{ padding: '16px 0', display: 'flex', alignItems: 'center', gap: 8, color: '#44474c', fontSize: 13 }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid #000', borderTopColor: 'transparent', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                Checking availability…
              </div>
            )}
            {displayedGroups.length === 0 && (
              <div style={{ padding: '48px 0', textAlign: 'center', color: '#44474c' }}>
                <p className="font-body text-sm">No apartments match your filters.</p>
                <button onClick={() => { setFilterMinBeds(0); setFilterRegion(null); setFilterAvailOnly(false); }} className="font-body text-sm" style={{ marginTop: 12, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: '#1c1c18' }}>Clear filters</button>
              </div>
            )}
            {displayedGroups.map((group) => (
              <div key={group.propertyName} ref={(el) => { groupRefs.current[group.propertySlug] = el; }}>
                {/* Group separator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '28px 0 20px' }}>
                  <span className="font-body" style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#44474c', whiteSpace: 'nowrap', fontWeight: 600 }}>
                    {group.propertyName}
                  </span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(197,198,205,0.5)' }} />
                  <span className="font-body" style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#c5c6cd', whiteSpace: 'nowrap' }}>
                    {group.units[0]?.postcode}
                  </span>
                </div>
                {/* Cards grid */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: isMobile ? 14 : 20 }}>
                  {group.units.map((unit) => {
                    const unitMedia = getListingMedia(unit.unitSlug);
                    const propertyMedia = getPropertyMedia(unit.propertySlug);
                    // Admin-uploaded cover photo wins; otherwise fall back to the static/scrape image.
                    const heroImg = publicUnits.overrides.get(unit.unitSlug)?.primaryImage || unitMedia?.primaryImage || propertyMedia.heroImage;
                    const { beds, baths } = specsToNumbers(unit.suppliedSpecs);
                    const key = `${unit.propertySlug}-${unit.unitSlug}`;
                    const isAvailable = availability ? (availability[unit.unitSlug] ?? true) : true;
                    const showBadge = availability !== null && !availLoading;
                    const isActive = focusedPropertySlug === unit.propertySlug;
                    return (
                      <article
                        key={key}
                        onClick={() => setFocusedPropertySlug(unit.propertySlug)}
                        style={{
                          background: '#fdf9f3', borderRadius: 12, overflow: 'hidden',
                          border: `1px solid ${isActive ? 'rgba(200,164,92,0.6)' : 'rgba(197,198,205,0.2)'}`,
                          opacity: showBadge && !isAvailable ? 0.55 : 1,
                          cursor: 'pointer', transition: 'box-shadow 0.15s',
                          boxShadow: isActive ? '0 0 0 2px rgba(200,164,92,0.3)' : 'none',
                        }}
                      >
                        <div style={{ height: 180, position: 'relative', overflow: 'hidden', background: '#e6e2dc' }}>
                          {heroImg && (
                            <img src={heroImg} alt={`${unit.propertyName} ${unit.unitName}`} referrerPolicy="no-referrer"
                              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            />
                          )}
                          <div style={{ position: 'absolute', top: 10, right: 10, background: showBadge ? (isAvailable ? 'rgba(34,197,94,0.9)' : 'rgba(239,68,68,0.85)') : 'rgba(253,249,243,0.9)', backdropFilter: 'blur(4px)', padding: '3px 10px', borderRadius: 999, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, color: showBadge ? '#fff' : '#1c1c18' }}>
                            {showBadge ? (isAvailable ? '✓ Available' : 'Booked') : 'Available'}
                          </div>
                        </div>
                        <div style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                            <h2 className="font-display text-primary" style={{ fontSize: 17, lineHeight: 1.3 }}>{unit.unitName}</h2>
                            <button onClick={(e) => { e.stopPropagation(); setLiked((l) => ({ ...l, [key]: !l[key] })); }} style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 6, flexShrink: 0 }}>
                              <Heart style={{ width: 15, height: 15, color: liked[key] ? '#000' : '#c5c6cd', fill: liked[key] ? '#000' : 'none' }} />
                            </button>
                          </div>
                          {unit.suppliedSpecs && (
                            <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#44474c', margin: '8px 0 10px' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Bed style={{ width: 11, height: 11 }} /> {beds} Bed{beds !== 1 ? 's' : ''}</span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Bath style={{ width: 11, height: 11 }} /> {baths} Bath{baths !== 1 ? 's' : ''}</span>
                            </div>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid rgba(197,198,205,0.2)', marginTop: unit.suppliedSpecs ? 0 : 10 }}>
                            {unit.airbnbUrl ? (
                              <a href={unit.airbnbUrl.startsWith('http') ? unit.airbnbUrl : `https://${unit.airbnbUrl}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="font-body text-on-surface-variant" style={{ fontSize: 10, textDecoration: 'none' }}>Airbnb ↗</a>
                            ) : <span />}
                            <Link to={`/properties/${unit.propertySlug}/${unit.unitSlug}`} onClick={(e) => e.stopPropagation()} className="font-body text-primary" style={{ padding: '5px 14px', border: '1px solid #000', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: 4 }}>View</Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: sticky map (desktop only) ── */}
        {!isMobile && (
          <div style={{ flex: 1, position: 'sticky', top: 80, height: 'calc(100vh - 80px)' }}>
            <PropertiesMap focusedPropertySlug={focusedPropertySlug} onMarkerClick={handleMarkerClick} />
          </div>
        )}
      </div>

      {datesOpen && (
        <DateRangePicker
          checkIn={checkIn}
          checkOut={checkOut}
          onChange={({ checkIn: ci, checkOut: co }) => { setCheckIn(ci); setCheckOut(co); }}
          onDone={() => setDatesOpen(false)}
        />
      )}
    </>
  );
}
