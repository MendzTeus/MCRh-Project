import { useState, useRef, useMemo } from 'react';
import { Plus, Minus, SlidersHorizontal as Tune, Quote } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import MediaImage from '../components/MediaImage';
import PropertyFeatureSection from '../components/PropertyFeatureSection';
import { locationAreas, manchesterMapEmbedUrl, mapLocations, type LocationArea } from '../data/locations';
import { useClickOutside } from '../hooks/useClickOutside';

export default function Home() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  useClickOutside(filterRef, () => setFiltersOpen(false), filtersOpen);
  const [selectedArea, setSelectedArea] = useState<LocationArea>('all');
  const [selectedLocationId, setSelectedLocationId] = useState(1);
  const [mapZoom, setMapZoom] = useState(1);
  const visibleLocations = useMemo(
    () => mapLocations.filter((location) => selectedArea === 'all' || location.areaId === selectedArea),
    [selectedArea],
  );

  return (
    <div className="animate-in fade-in duration-500">
      <Helmet>
        <title>MCRh | Luxury Short-Let Apartments in Manchester</title>
        <meta name="description" content="Premium short-term furnished apartments in Manchester — Chambers Residence, Ancoats, Wood Street, John Dalton Street and more. Book direct." />
        <meta property="og:title" content="MCRh | Luxury Short-Let Apartments in Manchester" />
        <meta property="og:description" content="Premium short-term furnished apartments in Manchester city centre. Experts in short-term lettings." />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/media/properties/chambers/01.jpeg" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      {/* Hero Section */}
      <section className="relative h-[90vh] min-h-[600px] w-full overflow-hidden flex items-end">
        <div className="absolute inset-0 z-0 bg-surface-dim">
           <MediaImage propertySlug="chambers" alt="MCRh Manchester apartment interior" loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/40 to-primary/10"></div>
        </div>
        <div className="relative z-10 w-full px-margin-mobile md:px-margin-desktop pb-12 md:pb-24 max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-end gap-8">
          <div className="max-w-3xl text-white">
            <h1 className="font-display text-display-lg-mobile md:text-display-lg text-white mb-6 leading-[1.1]">Experts In Short-Term Lettings</h1>
            <p className="font-body text-body-lg text-white/90 max-w-lg text-lg">The first choice for property rentals & hosting in Manchester.</p>
          </div>
          <div className="pb-2 w-full md:w-auto">
            <Link to="/properties" className="w-full md:w-auto inline-flex items-center justify-center border border-white text-white px-8 py-4 font-body text-label-caps tracking-widest uppercase hover:bg-white hover:text-primary transition-colors duration-300">
              EXPLORE PROPERTIES
            </Link>
          </div>
        </div>
      </section>

      <PropertyFeatureSection
        propertySlug="chambers"
        eyebrow="Featured Property"
        name="Chambers Residence"
        description="Experience the perfect blend of Manchester's rich industrial heritage and contemporary luxury. Located in the heart of the city, Chambers Residence offers a serene escape with bespoke furnishings, towering ceilings, and an atmosphere of curated calm."
        collectionSlug="chambers"
        cta="Book Now"
        imageLayout="stack"
        compact
      />

      <PropertyFeatureSection
        propertySlug="john-dalton-st"
        eyebrow="Heritage Collection"
        name="John Dalton Street"
        description="Set within a meticulously restored historic building, this residence celebrates architectural grandeur while providing uncompromising modern comfort. Expansive arched windows frame city views, while tactile brickwork and rich textiles create a deeply comforting environment."
        collectionSlug="john-dalton-st"
        cta="Explore Details"
        quote="A masterclass in urban sanctuary."
        imageLayout="grid"
        tinted
        compact
      />

      <PropertyFeatureSection
        propertySlug="wood-street"
        eyebrow="Wood Street Collection"
        name="Wood Street"
        description="Situated in a vibrant, historic quarter, Wood Street properties offer an unmatched blend of privacy and proximity to Manchester's cultural landmarks. Featuring tailored interiors, warm wood tones, and expansive natural light."
        collectionSlug="wood-street"
        cta="View Details"
        imageLayout="stack"
        compact
      />

      <PropertyFeatureSection
        propertySlug="ancoats"
        eyebrow="Ancoats District"
        name="Ancoats"
        description="Embrace the spirit of innovation in Ancoats. These residences lean into their industrial roots with polished concrete, exposed beams, and contemporary art, creating a dynamic yet refined living space for the modern traveler."
        collectionSlug="ancoats"
        cta="Explore Details"
        quote="Industrial roots, contemporary luxury."
        imageLayout="grid"
        tinted
        compact
      />

      <PropertyFeatureSection
        propertySlug="old-trafford"
        eyebrow="Trafford Exclusives"
        name="Trafford"
        description="A collection of spacious, tranquil retreats on the outskirts of the city bustle. Trafford properties are defined by their generous proportions, lush surroundings, and uncompromising commitment to elegant comfort."
        collectionSlug="old-trafford"
        cta="View Details"
        imageLayout="stack"
        compact
      />

      <PropertyFeatureSection
        propertySlug="the-collective"
        eyebrow="Curated Experiences"
        name="The Collective"
        description="An exclusive assortment of highly stylized and uniquely positioned properties. The Collective brings together the sharpest design, immersive aesthetics, and premier locations for the ultimate city escape."
        collectionSlug="the-collective"
        cta="Explore Details"
        quote="The sharpest design, immersive aesthetics."
        imageLayout="grid"
        tinted
        compact
      />

      {/* Interactive Properties Map Section - simplified for React structure */}
       <section className="py-section-gap px-margin-mobile md:px-margin-desktop bg-surface">
        <div className="max-w-[1280px] mx-auto flex flex-col lg:flex-row gap-8 lg:gap-16 h-auto lg:h-[800px]">
          <div className="w-full lg:w-1/2 flex flex-col h-full">
            <div className="flex justify-between items-center mb-8">
              <h2 className="font-display text-headline-md text-primary">Discover Our Locations</h2>
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
                          const nextLocation = mapLocations.find(
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
            
            <div className="overflow-y-auto pr-4 pb-4 space-y-6 flex-1 scrollbar-hide">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {visibleLocations.map((location) => (
                  <Link
                    to={`/collection/${location.collectionSlug}`}
                    key={location.id}
                    onClick={() => setSelectedLocationId(location.id)}
                    className={`bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm border group cursor-pointer hover:border-primary transition-all duration-300 text-left ${
                      selectedLocationId === location.id ? 'border-primary' : 'border-outline-variant/30'
                    }`}
                  >
                    <div className="aspect-[4/3] bg-surface-dim relative">
                       <MediaImage propertySlug={location.propertySlug} alt={`${location.name} apartment`} />
                    </div>
                    <div className="p-6">
                      <h3 className="font-display text-lg mb-1 text-primary">{location.name}</h3>
                      <p className="font-body text-sm text-on-surface-variant">{location.area} - {location.postcode}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
          
          <div className="w-full lg:w-1/2 h-[500px] lg:h-full rounded-2xl overflow-hidden relative border border-outline-variant/30 bg-surface-variant grayscale opacity-80">
            {/* Map placeholder visually */}
            <iframe
              title="Manchester locations map"
              src={manchesterMapEmbedUrl}
              className="absolute inset-0 h-full w-full border-0 pointer-events-none"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-primary/5 mix-blend-multiply pointer-events-none"></div>
            
            <div className="absolute top-6 left-6 z-20 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setMapZoom((zoom) => Math.min(3, zoom + 0.25))}
                className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center hover:bg-surface-dim transition-colors border border-outline-variant/30 text-primary"
              >
                <Plus className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setMapZoom((zoom) => Math.max(0.75, zoom - 0.25))}
                className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center hover:bg-surface-dim transition-colors border border-outline-variant/30 text-primary"
              >
                <Minus className="w-5 h-5" />
              </button>
            </div>
            
            <div
              className="absolute inset-0 z-10 transition-transform duration-300 pointer-events-none"
              style={{ transform: `scale(${mapZoom})` }}
            >
              {visibleLocations.map((location) => (
                <button
                  type="button"
                  key={location.id}
                  onClick={() => setSelectedLocationId(location.id)}
                  className="absolute cursor-pointer pointer-events-auto"
                  style={{ top: location.position.top, left: location.position.left }}
                  aria-label={`${location.name} ${location.postcode}`}
                  title={`${location.name} - ${location.postcode}`}
                >
                  <span
                    className={`block rounded-full shadow-md border transition-transform ${
                      selectedLocationId === location.id ? 'h-5 w-5 bg-primary scale-125' : 'h-4 w-4 bg-primary hover:scale-110'
                    }`}
                  ></span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Guest Experiences Editorial */}
      <section className="py-section-gap bg-surface-container-lowest border-t border-outline-variant/30">
        <div className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="text-center mb-16 md:mb-24">
            <span className="font-body text-label-caps text-secondary mb-4 block tracking-widest uppercase">Testimonials</span>
            <h2 className="font-display text-headline-md text-primary">Guest Experiences</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-12 lg:gap-24">
            <div className="flex flex-col items-center text-center">
              <Quote className="w-10 h-10 text-outline-variant mb-8 opacity-40 shrink-0" />
              <p className="font-display text-xl md:text-2xl leading-relaxed text-primary mb-12 grow">
                "An absolute masterclass in luxury hosting. Every detail of the apartment was thoughtfully curated, from the linens to the local guide provided."
              </p>
              <div className="flex flex-col items-center border-t border-outline-variant/30 pt-8 mt-auto w-24">
                <p className="font-body text-label-caps tracking-widest text-primary uppercase mb-2 whitespace-nowrap">Emma T.</p>
                <p className="font-body text-sm text-on-surface-variant whitespace-nowrap">Chambers Residence</p>
              </div>
            </div>

            <div className="flex flex-col items-center text-center">
              <Quote className="w-10 h-10 text-outline-variant mb-8 opacity-40 shrink-0" />
              <p className="font-display text-xl md:text-2xl leading-relaxed text-primary mb-12 grow">
                "The perfect urban sanctuary. I travel often for work and this felt more like a boutique hotel than a rental. Exceptionally clean and beautifully designed."
              </p>
              <div className="flex flex-col items-center border-t border-outline-variant/30 pt-8 mt-auto w-24">
                <p className="font-body text-label-caps tracking-widest text-primary uppercase mb-2 whitespace-nowrap">James H.</p>
                <p className="font-body text-sm text-on-surface-variant whitespace-nowrap">John Dalton Street</p>
              </div>
            </div>

            <div className="flex flex-col items-center text-center">
              <Quote className="w-10 h-10 text-outline-variant mb-8 opacity-40 shrink-0" />
              <p className="font-display text-xl md:text-2xl leading-relaxed text-primary mb-12 grow">
                "We loved our stay in Ancoats. The team at MCRh made checking in seamless, and the property exceeded all expectations. Highly recommended."
              </p>
              <div className="flex flex-col items-center border-t border-outline-variant/30 pt-8 mt-auto w-24">
                <p className="font-body text-label-caps tracking-widest text-primary uppercase mb-2 whitespace-nowrap">Sarah M.</p>
                <p className="font-body text-sm text-on-surface-variant whitespace-nowrap">Ancoats Retreat</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
