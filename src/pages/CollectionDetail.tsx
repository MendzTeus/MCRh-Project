import { BedDouble, Bath, PersonStanding } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { lazy, Suspense, useState, useRef, useMemo } from 'react';
import AvailabilityWidget from '../components/AvailabilityWidget';
import MediaImage from '../components/MediaImage';
import PhotoGallery from '../components/PhotoGallery';
import { getInventoryForProperty } from '../data/airbnbInventory';
import { getListingMedia } from '../data/listingMedia';
import { getPropertyBySlug } from '../data/properties';
import { getLocationsForProperty } from '../data/locations';
import { getReviewsForProperty } from '../data/reviews';
import { useAvailability } from '../hooks/useAvailability';
import { usePublicUnits } from '../hooks/usePublicUnits';
import { usePropertyPhotos } from '../hooks/usePropertyPhotos';
import { Star } from 'lucide-react';
const PropertyMap = lazy(() => import('../components/PropertyMap'));

export default function CollectionDetail() {
  const { id } = useParams();
  const property = getPropertyBySlug(id) || getPropertyBySlug('chambers');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const availability = useAvailability(property?.slug || '', checkIn, checkOut);
  const publicUnits = usePublicUnits();
  const propertyPhotos = usePropertyPhotos(property?.slug || '');
  const unitsRef = useRef<HTMLDivElement>(null);
  // Stable array reference so <PropertyMap> doesn't tear down and rebuild the
  // Leaflet map on every re-render (e.g. while checking availability).
  const propertyMapLocations = useMemo(
    () => getLocationsForProperty(property?.slug),
    [property?.slug],
  );

  if (!property) return null;

  // Hide apartments the admin has hidden; layer admin edits/photos over the rest.
  // When a property is wired to Airbnb inventory, show only its visible units —
  // if the admin has hidden them all (e.g. every listing paused), show none rather
  // than falling back to static cards. The static fallback is only for properties
  // that were never wired to Airbnb inventory at all.
  const wiredInventory = getInventoryForProperty(property.slug);
  const inventoryUnits = wiredInventory.filter((unit) => !publicUnits.hidden.has(unit.unitSlug));
  const collectionUnits = wiredInventory.length
    ? inventoryUnits.map((unit) => {
        const media = getListingMedia(unit.unitSlug);
        const o = publicUnits.overrides.get(unit.unitSlug);
        return {
          slug: unit.unitSlug,
          title: o?.unitName || media?.title || unit.unitName,
          label: o?.unitName || unit.unitName,
          specs: o?.suppliedSpecs || unit.suppliedSpecs || 'Specs to confirm',
          path: `/properties/${property.slug}/${unit.unitSlug}`,
          imageSrc: o?.primaryImage || media?.primaryImage,
        };
      })
    : property.units.map((unit) => ({
        slug: unit.slug,
        title: unit.title,
        label: unit.label,
        specs: unit.specs,
        path: `/properties/${property.slug}/${unit.slug}`,
        imageSrc: null,
      }));

  const reviews = getReviewsForProperty(property.slug);
  // Admin-uploaded photos override the static gallery when available.
  const heroSrc = propertyPhotos.primary?.url || property.imageSrc;
  const galleryUrls = propertyPhotos.gallery.length > 0 ? propertyPhotos.gallery : property.gallery;
  const hasGallery = galleryUrls && galleryUrls.length > 1;

  return (
    <div className="animate-in fade-in duration-500">
      <Helmet>
        <title>{property.name} | MCRh Manchester</title>
        <meta name="description" content={`${property.headline} ${property.description}`} />
        <meta property="og:title" content={`${property.name} | MCRh Manchester`} />
        <meta property="og:description" content={property.headline} />
        {heroSrc && <meta property="og:image" content={heroSrc} />}
      </Helmet>

      {/* Photo Gallery Hero */}
      {hasGallery ? (
        <section className="pt-6 px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto">
          <PhotoGallery images={galleryUrls} alt={property.imageAlt} />
        </section>
      ) : (
        <section className="w-full h-[80vh] min-h-[600px] relative flex flex-col justify-end pb-margin-desktop px-margin-mobile md:px-margin-desktop bg-surface-dim border-b border-outline-variant/30">
          <div className="absolute inset-0 z-0">
            {heroSrc ? <img src={heroSrc} alt={property.imageAlt} className="w-full h-full object-cover" loading="eager" /> : <MediaImage propertySlug={property.slug} alt={property.imageAlt} loading="eager" />}
            <div className="absolute inset-0 bg-gradient-to-t from-primary-container/80 to-transparent"></div>
          </div>
          <div className="relative z-10 max-w-[1280px] mx-auto w-full">
            <span className="font-body text-label-caps text-secondary-container mb-4 block tracking-widest uppercase">{property.area}</span>
            <h1 className="font-display text-display-lg-mobile md:text-display-lg text-white mb-6 max-w-3xl leading-tight">{property.name}</h1>
            <p className="font-body text-body-lg text-white/80 max-w-2xl text-lg">{property.headline}</p>
          </div>
        </section>
      )}

      {/* Title + specs when gallery is shown */}
      {hasGallery && (
        <section className="pt-8 pb-4 px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto">
          <span className="font-body text-label-caps text-secondary mb-2 block tracking-widest uppercase">{property.area}</span>
          <h1 className="font-display text-display-lg-mobile md:text-display-lg text-primary mb-4 max-w-3xl leading-tight">{property.name}</h1>
          <p className="font-body text-body-lg text-on-surface-variant max-w-2xl">{property.headline}</p>
        </section>
      )}

      <AvailabilityWidget
        propertyName={property.name}
        maxGuests={property.maxGuests}
        floating={!hasGallery}
        mode="availability"
        onDatesChange={(ci, co) => { setCheckIn(ci); setCheckOut(co); }}
        onCheckAvailability={() => unitsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
      />

      {/* Specs Row */}
      <section className="border-b border-outline-variant/30 py-6 mt-12 md:mt-16">
        <div className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop flex flex-wrap gap-8 md:gap-16 justify-center md:justify-start">
          <div className="flex items-center gap-3">
            <PersonStanding className="w-5 h-5 text-on-surface-variant" />
            <span className="font-body text-label-caps text-on-surface-variant tracking-widest uppercase">{property.maxGuests} GUESTS</span>
          </div>
          <div className="flex items-center gap-3">
            <BedDouble className="w-5 h-5 text-on-surface-variant" />
            <span className="font-body text-label-caps text-on-surface-variant tracking-widest uppercase">{property.bedrooms} BEDROOMS</span>
          </div>
          <div className="flex items-center gap-3">
            <BedDouble className="w-5 h-5 text-on-surface-variant" />
            <span className="font-body text-label-caps text-on-surface-variant tracking-widest uppercase">{property.beds} BEDS</span>
          </div>
          <div className="flex items-center gap-3">
            <Bath className="w-5 h-5 text-on-surface-variant" />
            <span className="font-body text-label-caps text-on-surface-variant tracking-widest uppercase">{property.bathrooms} BATHROOMS</span>
          </div>
        </div>
      </section>

      {/* Long Description & collection grid */}
      <section ref={unitsRef} className="py-section-gap px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto border-t border-outline-variant/30">
        <div className="mb-12">
          <span className="font-body text-label-caps text-secondary mb-2 block tracking-widest uppercase">{property.eyebrow}</span>
          <h2 className="font-display text-headline-md md:text-display-lg text-primary">{property.name}</h2>
          <p className="mt-6 max-w-2xl font-body text-body-lg text-on-surface-variant">{property.description}</p>
        </div>
        
        {availability.loading && checkIn && checkOut && (
          <div className="mt-6 flex items-center gap-2 text-on-surface-variant font-body text-sm">
            <span className="w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin inline-block" />
            Checking availability…
          </div>
        )}
        {availability.configured && checkIn && checkOut && !availability.loading && (
          <div className="mt-6 flex items-center gap-3">
            <span className="font-body text-label-caps text-secondary tracking-widest uppercase text-xs">
              Showing availability for selected dates
            </span>
            <span className="flex items-center gap-1 text-xs font-body text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> {availability.units.filter(u => u.available).length} available
            </span>
          </div>
        )}
        {collectionUnits.length === 0 && (
          <div className="mt-12 rounded-lg border border-outline-variant/30 bg-surface-dim px-6 py-12 text-center">
            <p className="font-body text-body-lg text-on-surface-variant">
              No residences are available to book here right now. Please check back soon or get in touch.
            </p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12 mt-12">
          {collectionUnits.map((apt) => {
            const avUnit = availability.units.find((u) => u.unitSlug === apt.slug);
            const showBadge = availability.configured && checkIn && checkOut && !availability.loading;
            const isAvailable = avUnit?.available ?? true;

            const cardContent = (
              <>
              <div className="aspect-[16/9] overflow-hidden rounded mb-4 bg-surface-dim relative">
                <MediaImage src={apt.imageSrc || undefined} propertySlug={property.slug} alt={apt.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                {showBadge && (
                  <div className={`absolute top-3 left-3 px-3 py-1 rounded-full font-body text-[10px] tracking-widest uppercase font-semibold shadow-sm ${
                    isAvailable
                      ? 'bg-green-500 text-white'
                      : 'bg-red-500/90 text-white'
                  }`}>
                    {isAvailable ? '✓ Available' : 'Booked'}
                  </div>
                )}
                {showBadge && !isAvailable && (
                  <div className="absolute inset-0 bg-primary/20 pointer-events-none rounded" />
                )}
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="font-display text-headline-sm text-primary">{apt.title}</h3>
                  <p className="font-body text-[10px] text-on-surface-variant tracking-widest uppercase">{apt.label} · {apt.specs}</p>
                </div>
                <span className="font-body text-label-caps text-primary border-b border-primary pb-1 group-hover:text-secondary group-hover:border-secondary transition-colors uppercase tracking-widest">
                  View Residence
                </span>
              </div>
              </>
            );

            return (
              <Link to={apt.path} key={apt.slug} className={`group cursor-pointer block ${showBadge && !isAvailable ? 'opacity-60' : ''}`}>
                {cardContent}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Editor's Map Section */}
      <section className="py-section-gap px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto border-t border-outline-variant/30">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 items-center">
          <div className="md:col-span-7">
            <div className="aspect-[16/9] rounded-lg overflow-hidden border border-outline-variant/30">
              <Suspense fallback={<div className="w-full h-full bg-surface-dim flex items-center justify-center"><span className="font-body text-label-caps text-on-surface-variant/50 tracking-widest uppercase">Loading map…</span></div>}>
                <PropertyMap locations={propertyMapLocations} height="100%" />
              </Suspense>
            </div>
          </div>
          <div className="md:col-span-5">
            <span className="font-body text-label-caps text-secondary mb-2 block tracking-widest uppercase">The Neighborhood</span>
            <h2 className="font-display text-headline-md md:text-display-lg text-primary mb-8">{property.neighborhoodTitle}</h2>

            <div className="space-y-6">
              {property.distances.map((item, i) => (
                <div key={i} className="flex justify-between items-end border-b border-outline-variant/30 pb-2">
                  <span className="font-body text-body-lg text-primary">{item.location}</span>
                  <span className="font-body text-label-caps text-on-surface-variant uppercase tracking-widest">{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      {reviews.length > 0 && (
        <section className="py-section-gap px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto border-t border-outline-variant/30">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <span className="font-body text-label-caps text-secondary mb-2 block tracking-widest uppercase">Guest Reviews</span>
              <h2 className="font-display text-headline-md text-primary">What Guests Say</h2>
            </div>
            <div className="flex items-center gap-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-[#C8A45C] text-[#C8A45C]" />
              ))}
              <span className="font-body text-label-caps text-on-surface-variant tracking-widest uppercase ml-2">5.0</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {reviews.map((review, i) => (
              <div key={i} className="border border-outline-variant/30 rounded-xl p-6 bg-surface-container-lowest flex flex-col gap-4">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, si) => (
                    <Star key={si} className="w-3 h-3 fill-[#C8A45C] text-[#C8A45C]" />
                  ))}
                </div>
                <p className="font-body text-body-md text-on-surface-variant flex-1 leading-relaxed whitespace-normal break-words text-center">"{review.text}"</p>
                <div className="border-t border-outline-variant/20 pt-4">
                  <p className="font-body text-label-caps text-primary tracking-widest uppercase text-xs">{review.name}</p>
                  {review.date && <p className="font-body text-xs text-on-surface-variant mt-0.5">{review.date}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
