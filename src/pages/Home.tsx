import { useState, useRef, useMemo, lazy, Suspense } from 'react';
import { SlidersHorizontal as Tune, Star } from 'lucide-react';
const PropertyMap = lazy(() => import('../components/PropertyMap'));
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import MediaImage from '../components/MediaImage';
import PropertyFeatureSection from '../components/PropertyFeatureSection';
import { locationAreas, getLocationGroups, groupLocationsByRegion, type LocationArea } from '../data/locations';
import { useMapLocations } from '../hooks/useMapLocations';
import { useClickOutside } from '../hooks/useClickOutside';
import { useSiteContent, text, list } from '../hooks/useSiteContent';
import { airbnbInventory, getInventoryForProperty } from '../data/airbnbInventory';
import { getUnitGallery, getListingMedia, getLocationCardImage } from '../data/listingMedia';
import { getPropertyBySlug, properties } from '../data/properties';
import { usePublicUnits } from '../hooks/usePublicUnits';
import { usePublicProperties } from '../hooks/usePublicProperties';
import { useFeaturedReviews } from '../hooks/useReviews';

type FeaturedUnit = {
  slug: string;
  propertySlug: string;
  name: string;
  description: string;
  images: string[];
  href: string;
};

export default function Home() {
  const site = useSiteContent();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  useClickOutside(filterRef, () => setFiltersOpen(false), filtersOpen);
  const [selectedArea, setSelectedArea] = useState<LocationArea>('all');
  const [selectedLocationId, setSelectedLocationId] = useState(1);
  const [focusedCoords, setFocusedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const allLocations = useMapLocations();
  const visibleLocations = useMemo(
    () => allLocations.filter((location) => selectedArea === 'all' || location.areaId === selectedArea),
    [allLocations, selectedArea],
  );
  const publicUnits = usePublicUnits();
  const publicProperties = usePublicProperties();
  const featuredReviews = useFeaturedReviews();
  // Drop location cards whose collection has no bookable (visible) units left —
  // e.g. a single-unit collection whose only listing is paused/hidden in the
  // admin — so the list never links to an empty collection page. Collections
  // never wired to Airbnb inventory keep their card (they render static units).
  const listableLocations = useMemo(
    () => visibleLocations.filter((location) => {
      const inv = getInventoryForProperty(location.collectionSlug);
      return inv.length === 0 || inv.some((unit) => !publicUnits.hidden.has(unit.unitSlug));
    }),
    [visibleLocations, publicUnits],
  );
  // Cards are grouped by region/building; the map shows one pin per group.
  const visibleGroups = useMemo(() => getLocationGroups(listableLocations), [listableLocations]);
  const groupedMapLocations = useMemo(() => groupLocationsByRegion(visibleLocations), [visibleLocations]);

  // Featured units are chosen in the admin (SiteContent → home.featured: ordered
  // list of unitSlugs). Falls back to the Chambers block when none are set.
  const featuredUnits = useMemo<FeaturedUnit[]>(() => {
    if (!publicProperties.loaded) return [];
    const slugs = list<string>(site.content, 'home.featured', []);
    return slugs.flatMap((slug): FeaturedUnit[] => {
      if (publicUnits.hidden.has(slug)) return [];
      const inv = airbnbInventory.find((u) => u.unitSlug === slug);
      if (!inv) return [];
      const media = getListingMedia(slug);
      const override = publicUnits.overrides.get(slug);
      // Description: the unit's own collection, or the collection that groups it
      // (e.g. chambers-11 → the Chambers collection), else the listing title.
      const staticProperty = getPropertyBySlug(inv.propertySlug)
        || properties.find((p) => getInventoryForProperty(p.slug).some((iu) => iu.unitSlug === slug));
      const canonicalProperty = staticProperty
        ? publicProperties.bySlug.get(staticProperty.slug)
        : undefined;
      return [{
        slug,
        propertySlug: inv.propertySlug,
        name: override?.unitName || media?.title || inv.unitName,
        description: override?.description || canonicalProperty?.description || media?.title || '',
        images: getUnitGallery(slug, inv.propertySlug),
        href: `/properties/${inv.propertySlug}/${slug}`,
      }];
    });
  }, [site.content, publicUnits, publicProperties]);

  const homeReviewCards = useMemo(() => featuredReviews.reviews.slice(0, 3).map((review) => {
    const reviewSlug = review.propertySlug || '';
    const inventoryUnit = airbnbInventory.find((unit) => unit.unitSlug === reviewSlug);
    const staticProperty = inventoryUnit
      ? getPropertyBySlug(inventoryUnit.propertySlug)
        || properties.find((property) => getInventoryForProperty(property.slug)
          .some((unit) => unit.unitSlug === inventoryUnit.unitSlug))
      : undefined;
    const canonicalProperty = publicProperties.bySlug.get(reviewSlug)
      || (staticProperty ? publicProperties.bySlug.get(staticProperty.slug) : undefined);

    return {
      ...review,
      property: canonicalProperty?.name || inventoryUnit?.propertyName || review.property || 'MCRh Manchester',
      rating: Math.max(1, Math.min(5, Math.round(review.rating || 5))),
    };
  }), [featuredReviews.reviews, publicProperties.bySlug]);

  return (
    <div className="animate-in fade-in duration-500">
      <Helmet>
        <title>{text(site.content, 'seo.home.title', 'MCRh | Luxury Short-Let Apartments in Manchester')}</title>
        <meta name="description" content={text(site.content, 'seo.home.description', 'Premium short-term furnished apartments in Manchester — Chambers Residence, Ancoats, Wood Street, John Dalton Street and more. Book direct.')} />
        <meta property="og:title" content={text(site.content, 'seo.home.ogTitle', 'MCRh | Luxury Short-Let Apartments in Manchester')} />
        <meta property="og:description" content={text(site.content, 'seo.home.ogDescription', 'Premium short-term furnished apartments in Manchester city centre. Experts in short-term lettings.')} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={site.images['home.hero']?.url || '/media/properties/chambers/01.jpeg'} />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      {/* Hero Section */}
      <section className="relative h-[90vh] min-h-[600px] w-full overflow-hidden flex items-end">
        <div className="absolute inset-0 z-0 bg-surface-dim">
           {/* The hero image comes ONLY from the admin (SiteImage 'home.hero').
               There is no built-in/Airbnb fallback: until the admin overlay
               loads (or if no image is set) the dark bg-surface-dim shows and
               nothing is flashed over. */}
           {site.images['home.hero'] && (
             <img src={site.images['home.hero'].url} alt={site.images['home.hero'].alt || 'MCRh Manchester apartment interior'} className="w-full h-full object-cover" />
           )}
          <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/40 to-primary/10"></div>
        </div>
        <div className="relative z-10 w-full px-margin-mobile md:px-margin-desktop pb-12 md:pb-24 max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-end gap-8">
          <div className="max-w-3xl text-white">
            <h1 className="font-display text-display-lg-mobile md:text-display-lg text-white mb-6 leading-[1.1]">{text(site.content, 'home.hero.title', 'Experts In Short-Term Lettings')}</h1>
            <p className="font-body text-body-lg text-white/90 max-w-lg text-lg">{text(site.content, 'home.hero.subtitle', 'The first choice for property rentals & hosting in Manchester.')}</p>
          </div>
          <div className="pb-2 w-full md:w-auto">
            <Link to={text(site.content, 'home.hero.ctaHref', '/properties')} className="w-full md:w-auto inline-flex items-center justify-center border border-white text-white px-8 py-4 font-body text-label-caps tracking-widest uppercase hover:bg-white hover:text-primary transition-colors duration-300">
              {text(site.content, 'home.hero.ctaLabel', 'Explore Properties')}
            </Link>
          </div>
        </div>
      </section>

      {featuredUnits.length > 0 ? (
        featuredUnits.map((u: FeaturedUnit) => (
          <div key={u.slug} style={{ display: 'contents' }}>
            <PropertyFeatureSection
              propertySlug={u.propertySlug}
              eyebrow={text(site.content, 'home.block.chambers.eyebrow', 'Featured Property')}
              name={u.name}
              description={u.description}
              images={site.images['home.block.chambers'] ? [site.images['home.block.chambers'].url, ...u.images.slice(1)] : u.images}
              href={u.href}
              collectionSlug={u.propertySlug}
              cta={text(site.content, 'home.block.chambers.cta', 'Book Now')}
              imageLayout="stack"
              compact
            />
          </div>
        ))
      ) : (
        <PropertyFeatureSection
          propertySlug="chambers"
          eyebrow={text(site.content, 'home.block.chambers.eyebrow', 'Featured Property')}
          name={text(site.content, 'home.block.chambers.name', 'Chambers Residence')}
          description={text(site.content, 'home.block.chambers.description', "Experience the perfect blend of Manchester's rich industrial heritage and contemporary luxury. Located in the heart of the city, Chambers Residence offers a serene escape with bespoke furnishings, towering ceilings, and an atmosphere of curated calm.")}
          images={site.images['home.block.chambers'] ? [site.images['home.block.chambers'].url] : undefined}
          collectionSlug="chambers"
          cta={text(site.content, 'home.block.chambers.cta', 'Book Now')}
          imageLayout="stack"
          compact
        />
      )}

      <PropertyFeatureSection
        propertySlug="john-dalton-st"
        eyebrow={text(site.content, 'home.block.john-dalton-st.eyebrow', 'Heritage Collection')}
        name={text(site.content, 'home.block.john-dalton-st.name', 'John Dalton Street')}
        description={text(site.content, 'home.block.john-dalton-st.description', 'Set within a meticulously restored historic building, this residence celebrates architectural grandeur while providing uncompromising modern comfort. Expansive arched windows frame city views, while tactile brickwork and rich textiles create a deeply comforting environment.')}
        images={site.images['home.block.john-dalton-st'] ? [site.images['home.block.john-dalton-st'].url] : undefined}
        collectionSlug="john-dalton-st"
        cta={text(site.content, 'home.block.john-dalton-st.cta', 'Explore Details')}
        quote={text(site.content, 'home.block.john-dalton-st.quote', 'A masterclass in urban sanctuary.')}
        imageLayout="grid"
        tinted
        compact
      />

      <PropertyFeatureSection
        propertySlug="wood-street"
        eyebrow={text(site.content, 'home.block.wood-street.eyebrow', 'Wood Street Collection')}
        name={text(site.content, 'home.block.wood-street.name', 'Wood Street')}
        description={text(site.content, 'home.block.wood-street.description', "Situated in a vibrant, historic quarter, Wood Street properties offer an unmatched blend of privacy and proximity to Manchester's cultural landmarks. Featuring tailored interiors, warm wood tones, and expansive natural light.")}
        images={site.images['home.block.wood-street'] ? [site.images['home.block.wood-street'].url] : undefined}
        collectionSlug="wood-street"
        cta={text(site.content, 'home.block.wood-street.cta', 'View Details')}
        imageLayout="stack"
        compact
      />

      <PropertyFeatureSection
        propertySlug="ancoats"
        eyebrow={text(site.content, 'home.block.ancoats.eyebrow', 'Ancoats District')}
        name={text(site.content, 'home.block.ancoats.name', 'Ancoats')}
        description={text(site.content, 'home.block.ancoats.description', 'Embrace the spirit of innovation in Ancoats. These residences lean into their industrial roots with polished concrete, exposed beams, and contemporary art, creating a dynamic yet refined living space for the modern traveler.')}
        images={site.images['home.block.ancoats'] ? [site.images['home.block.ancoats'].url] : undefined}
        collectionSlug="ancoats"
        cta={text(site.content, 'home.block.ancoats.cta', 'Explore Details')}
        quote={text(site.content, 'home.block.ancoats.quote', 'Industrial roots, contemporary luxury.')}
        imageLayout="grid"
        tinted
        compact
      />

      <PropertyFeatureSection
        propertySlug="old-trafford"
        eyebrow={text(site.content, 'home.block.old-trafford.eyebrow', 'Trafford Exclusives')}
        name={text(site.content, 'home.block.old-trafford.name', 'Trafford')}
        description={text(site.content, 'home.block.old-trafford.description', 'A collection of spacious, tranquil retreats on the outskirts of the city bustle. Trafford properties are defined by their generous proportions, lush surroundings, and uncompromising commitment to elegant comfort.')}
        images={site.images['home.block.old-trafford'] ? [site.images['home.block.old-trafford'].url] : undefined}
        collectionSlug="old-trafford"
        cta={text(site.content, 'home.block.old-trafford.cta', 'View Details')}
        imageLayout="stack"
        compact
      />

      <PropertyFeatureSection
        propertySlug="the-collective"
        eyebrow={text(site.content, 'home.block.the-collective.eyebrow', 'Curated Experiences')}
        name={text(site.content, 'home.block.the-collective.name', 'The Collective')}
        description={text(site.content, 'home.block.the-collective.description', 'An exclusive assortment of highly stylized and uniquely positioned properties. The Collective brings together the sharpest design, immersive aesthetics, and premier locations for the ultimate city escape.')}
        images={site.images['home.block.the-collective'] ? [site.images['home.block.the-collective'].url] : undefined}
        collectionSlug="the-collective"
        cta={text(site.content, 'home.block.the-collective.cta', 'Explore Details')}
        quote={text(site.content, 'home.block.the-collective.quote', 'The sharpest design, immersive aesthetics.')}
        imageLayout="grid"
        tinted
        compact
      />

      {/* Interactive Properties Map Section - simplified for React structure.
          Hidden entirely on mobile (no adapted version) per QA — desktop only. */}
       <section className="hidden lg:block py-section-gap px-margin-mobile md:px-margin-desktop bg-surface">
        <div className="max-w-[1280px] mx-auto flex flex-col lg:flex-row gap-8 lg:gap-16 h-auto lg:h-[800px]">
          <div className="w-full lg:w-1/2 flex flex-col h-full">
            <div className="flex justify-between items-center mb-8">
              <h2 className="font-display text-headline-md text-primary">{text(site.content, 'home.map.title', 'Discover Our Locations')}</h2>
              <div className="flex items-center gap-4 relative" ref={filterRef}>
                <button
                  type="button"
                  onClick={() => setFiltersOpen((open) => !open)}
                  className="flex items-center gap-2 border border-outline-variant/60 px-4 py-2 rounded-full font-body text-label-caps tracking-widest uppercase hover:bg-surface-dim transition-colors"
                >
                  <Tune className="w-4 h-4" /> Filters
                </button>
                {filtersOpen && (
                  <div className="absolute right-0 top-full mt-3 z-20 w-48 rounded-lg border border-outline-variant/30 bg-surface p-2 shadow-xl">
                    {locationAreas.map((area) => (
                      <button
                        key={area.id}
                        type="button"
                        onClick={() => {
                          setSelectedArea(area.id);
                          setFiltersOpen(false);
                          const nextLocation = allLocations.find(
                            (location) => area.id === 'all' || location.areaId === area.id,
                          );
                          if (nextLocation) setSelectedLocationId(nextLocation.id);
                        }}
                        className={`block w-full rounded px-3 py-2 text-left font-body text-sm transition-colors ${
                          selectedArea === area.id ? 'bg-surface-container text-primary' : 'text-on-surface-variant hover:bg-surface-dim'
                        }`}
                      >
                        {area.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="overflow-y-auto pr-4 pb-4 space-y-10 flex-1 scrollbar-hide">
              {visibleGroups.map((group) => (
                <div key={group.id} className="space-y-4">
                  <div className="flex items-center gap-4">
                    <h3 className="font-body text-label-caps text-primary tracking-widest uppercase text-xs whitespace-nowrap">{group.label}</h3>
                    <div className="flex-1 h-px bg-outline-variant/40" />
                    <span className="font-body text-[10px] text-on-surface-variant/60 tracking-widest uppercase whitespace-nowrap">
                      {group.locations.length} {group.locations.length === 1 ? 'Residence' : 'Residences'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {group.locations.map((location, cardIndex) => (
                      <div
                        key={location.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          setSelectedLocationId(location.id);
                          setFocusedCoords({ ...location.coordinates });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedLocationId(location.id);
                            setFocusedCoords({ ...location.coordinates });
                          }
                        }}
                        className={`bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm border group cursor-pointer hover:border-primary transition-all duration-300 text-left ${
                          selectedLocationId === location.id ? 'border-primary' : 'border-outline-variant/30'
                        }`}
                      >
                        <div className="aspect-[4/3] bg-surface-dim relative">
                           <MediaImage src={getLocationCardImage(location.collectionSlug, location.propertySlug, cardIndex)} alt={`${location.name} apartment`} />
                        </div>
                        <div className="p-6">
                          <h3 className="font-display text-lg mb-1 text-primary">{location.name}</h3>
                          <p className="font-body text-sm text-on-surface-variant">{location.area} - {location.postcode}</p>
                          <Link
                            to={`/collection/${location.collectionSlug}`}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-4 inline-block font-body text-label-caps text-xs tracking-widest uppercase text-primary border-b border-primary pb-0.5 hover:text-secondary hover:border-secondary transition-colors"
                          >
                            View →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="w-full lg:w-1/2 h-[500px] lg:h-full rounded-2xl overflow-hidden relative border border-outline-variant/30">
            <Suspense fallback={<div className="w-full h-full bg-surface-dim flex items-center justify-center"><span className="font-body text-label-caps text-on-surface-variant/50 tracking-widest uppercase">Loading map…</span></div>}>
              <PropertyMap locations={groupedMapLocations} height="100%" focusedCoords={focusedCoords} areaCircles selectedLocationId={selectedLocationId} />
            </Suspense>
          </div>
        </div>
      </section>

      {/* Stats / Numbers Section */}
      <section className="py-section-gap bg-primary border-t border-white/10">
        <div className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-0 divide-y-2 md:divide-y-0 md:divide-x divide-white/10">
          {list<{ value: string; label: string }>(site.content, 'home.stats', [
            { value: '30+', label: 'Properties' },
            { value: '500+', label: 'Guest Reviews' },
            { value: '100%', label: '5-Star Stays' },
            { value: '7', label: 'Neighbourhoods' },
          ]).map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center text-center py-6 md:py-0 px-4">
              <span className="font-display text-5xl md:text-6xl text-white mb-3 leading-none">{value}</span>
              <span className="font-body text-label-caps text-white/50 tracking-widest uppercase text-xs">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Published Airbnb reviews — no generic/static testimonial fallback. */}
      {featuredReviews.loaded && homeReviewCards.length > 0 && (
        <section className="py-section-gap bg-surface-container-lowest border-t border-outline-variant/30">
          <div className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop">
            <div className="text-center mb-16 md:mb-24">
              <span className="font-body text-label-caps text-secondary mb-4 block tracking-widest uppercase">{text(site.content, 'home.testimonials.eyebrow', 'Testimonials')}</span>
              <h2 className="font-display text-headline-md text-primary">{text(site.content, 'home.testimonials.title', 'Guest Experiences')}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-12 lg:gap-20">
              {homeReviewCards.map((review) => (
                <article key={review.id || `${review.name}-${review.date}`} className="flex flex-col items-center text-center">
                  <div
                    className="flex items-center gap-1 mb-7"
                    aria-label={`${review.rating} out of 5 stars`}
                  >
                    {Array.from({ length: 5 }, (_, index) => (
                      <Star
                        key={index}
                        className="w-4 h-4 text-secondary"
                        fill={index < review.rating ? 'currentColor' : 'none'}
                      />
                    ))}
                  </div>
                  <p className="font-display text-xl md:text-2xl leading-relaxed text-primary mb-10 grow">
                    “{review.text}”
                  </p>
                  <div className="flex items-center gap-3 border-t border-outline-variant/30 pt-6 mt-auto min-w-0">
                    <div className="relative w-11 h-11 rounded-full bg-surface-dim overflow-hidden shrink-0 flex items-center justify-center">
                      <span className="font-body text-sm text-on-surface-variant">{review.name?.charAt(0) || 'G'}</span>
                      {review.avatarUrl && (
                        <img
                          src={review.avatarUrl}
                          alt={review.name}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          className="absolute inset-0 w-full h-full object-cover"
                          onError={(event) => { event.currentTarget.style.display = 'none'; }}
                        />
                      )}
                    </div>
                    <div className="text-left min-w-0">
                      <p className="font-body text-label-caps tracking-widest text-primary uppercase truncate">{review.name}</p>
                      <p className="font-body text-xs text-on-surface-variant mt-1 truncate">{review.date} · {review.property}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
