import { useState } from 'react';
import { Plus, Minus, SlidersHorizontal as Tune, Quote } from 'lucide-react';
import { Link } from 'react-router-dom';
import MediaImage from '../components/MediaImage';
import { locationAreas, manchesterMapEmbedUrl, mapLocations, type LocationArea } from '../data/locations';

export default function Home() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState<LocationArea>('all');
  const [selectedLocationId, setSelectedLocationId] = useState(1);
  const [mapZoom, setMapZoom] = useState(1);
  const visibleLocations = mapLocations.filter(
    (location) => selectedArea === 'all' || location.areaId === selectedArea,
  );

  return (
    <div className="animate-in fade-in duration-500">
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

      {/* Property Feature: Chambers Residence */}
      <section className="py-section-gap px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 lg:gap-24 items-center">
          <div className="md:col-span-7 relative h-[500px] md:h-[700px]">
            <div className="absolute top-0 left-0 w-[85%] h-[85%] rounded-lg overflow-hidden shadow-sm bg-surface-dim">
                <MediaImage propertySlug="chambers" index={0} alt="Chambers Residence apartment" />
            </div>
            <div className="absolute bottom-0 right-0 w-[55%] h-[55%] rounded-lg overflow-hidden shadow-2xl z-10 bg-surface-dim border border-outline-variant/30">
                <MediaImage propertySlug="chambers" index={1} alt="Chambers Residence bedroom detail" />
            </div>
          </div>
          <div className="md:col-span-5">
            <span className="inline-block font-body text-label-caps text-secondary mb-6 tracking-widest uppercase">FEATURED PROPERTY</span>
            <h2 className="font-display text-headline-md text-primary mb-6">Chambers Residence</h2>
            <p className="font-body text-body-lg text-on-surface-variant mb-10 opacity-90 leading-relaxed">
              Experience the perfect blend of Manchester's rich industrial heritage and contemporary luxury. Located in the heart of the city, Chambers Residence offers a serene escape with bespoke furnishings, towering ceilings, and an atmosphere of curated calm.
            </p>
            <Link to="/collection/chambers" className="inline-flex items-center justify-center border border-primary text-primary px-8 py-4 font-body text-label-caps tracking-widest uppercase hover:bg-surface-dim transition-colors duration-300">
              BOOK NOW
            </Link>
          </div>
        </div>
      </section>
      
      {/* Property Feature: John Dalton Street */}
      <section className="py-section-gap px-margin-mobile md:px-margin-desktop bg-surface-container-low border-y border-outline-variant/30">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-16 lg:gap-24 items-center">
          <div className="md:col-span-5 order-2 md:order-1">
            <span className="inline-block font-body text-label-caps text-secondary mb-6 tracking-widest uppercase">HERITAGE COLLECTION</span>
            <h2 className="font-display text-headline-md text-primary mb-6">John Dalton Street</h2>
            <p className="font-body text-body-lg text-on-surface-variant mb-10 opacity-90 leading-relaxed">
               Set within a meticulously restored historic building, this residence celebrates architectural grandeur while providing uncompromising modern comfort. Expansive arched windows frame city views, while tactile brickwork and rich textiles create a deeply comforting environment.
            </p>
            <Link to="/collection/john-dalton-st" className="inline-flex items-center justify-center border border-primary text-primary px-8 py-4 font-body text-label-caps tracking-widest uppercase hover:bg-surface-dim transition-colors duration-300">
              EXPLORE DETAILS
            </Link>
          </div>
          <div className="md:col-span-7 order-1 md:order-2">
            <div className="grid grid-cols-2 gap-4 h-[500px] md:h-[700px]">
              <div className="col-span-1 row-span-2 rounded-lg overflow-hidden bg-surface-dim">
                <MediaImage propertySlug="john-dalton-st" index={0} alt="John Dalton Street apartment" />
              </div>
              <div className="col-span-1 row-span-1 rounded-lg overflow-hidden bg-surface-dim">
                <MediaImage propertySlug="john-dalton-st" index={1} alt="John Dalton Street interior detail" />
              </div>
              <div className="col-span-1 row-span-1 rounded-lg overflow-hidden bg-surface-variant flex items-center justify-center p-8 border border-outline-variant/30">
                <p className="font-display text-2xl text-center leading-snug">"A masterclass in urban sanctuary."</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Property Feature: Wood Street */}
      <section className="py-section-gap px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 lg:gap-24 items-center">
          <div className="md:col-span-7 relative h-[500px] md:h-[700px]">
            <div className="absolute top-0 left-0 w-[85%] h-[85%] rounded-lg overflow-hidden shadow-sm bg-surface-dim">
              <MediaImage propertySlug="wood-street" index={0} alt="Wood Street apartment" />
            </div>
            <div className="absolute bottom-0 right-0 w-[55%] h-[55%] rounded-lg overflow-hidden shadow-2xl z-10 bg-surface-dim border border-outline-variant/30">
                <MediaImage propertySlug="wood-street" index={1} alt="Wood Street apartment detail" />
            </div>
          </div>
          <div className="md:col-span-5">
            <span className="inline-block font-body text-label-caps text-secondary mb-6 tracking-widest uppercase">WOOD STREET COLLECTION</span>
            <h2 className="font-display text-headline-md text-primary mb-6">Wood Street</h2>
            <p className="font-body text-body-lg text-on-surface-variant mb-10 opacity-90 leading-relaxed">
              Situated in a vibrant, historic quarter, Wood Street properties offer an unmatched blend of privacy and proximity to Manchester's cultural landmarks. Featuring tailored interiors, warm wood tones, and expansive natural light.
            </p>
            <Link to="/collection/wood-street" className="inline-flex items-center justify-center border border-primary text-primary px-8 py-4 font-body text-label-caps tracking-widest uppercase hover:bg-surface-dim transition-colors duration-300">
              VIEW DETAILS
            </Link>
          </div>
        </div>
      </section>

      {/* Property Feature: Ancoats */}
      <section className="py-section-gap px-margin-mobile md:px-margin-desktop bg-surface-container-low border-y border-outline-variant/30">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-16 lg:gap-24 items-center">
          <div className="md:col-span-5 order-2 md:order-1 mt-12 md:mt-0">
            <span className="inline-block font-body text-label-caps text-secondary mb-6 tracking-widest uppercase">ANCOATS DISTRICT</span>
            <h2 className="font-display text-headline-md text-primary mb-6">Ancoats</h2>
            <p className="font-body text-body-lg text-on-surface-variant mb-10 opacity-90 leading-relaxed">
              Embrace the spirit of innovation in Ancoats. These residences lean into their industrial roots with polished concrete, exposed beams, and contemporary art, creating a dynamic yet refined living space for the modern traveler.
            </p>
            <Link to="/collection/ancoats" className="inline-flex items-center justify-center border border-primary text-primary px-8 py-4 font-body text-label-caps tracking-widest uppercase hover:bg-surface-dim transition-colors duration-300">
              EXPLORE DETAILS
            </Link>
          </div>
          <div className="md:col-span-7 order-1 md:order-2">
            <div className="grid grid-cols-2 gap-4 h-[500px] md:h-[700px]">
              <div className="col-span-1 row-span-2 rounded-lg overflow-hidden bg-primary">
                <MediaImage propertySlug="ancoats" index={0} alt="Ancoats apartment" />
              </div>
              <div className="col-span-1 row-span-1 rounded-lg overflow-hidden bg-surface-dim">
                <MediaImage propertySlug="ancoats" index={1} alt="Ancoats interior detail" />
              </div>
              <div className="col-span-1 row-span-1 rounded-lg overflow-hidden bg-surface-container-lowest flex items-center justify-center p-8 border border-outline-variant/30">
                <p className="font-display text-2xl md:text-3xl text-primary text-center leading-snug">"Industrial roots, contemporary luxury."</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Property Feature: Trafford */}
      <section className="py-section-gap px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 lg:gap-24 items-center">
          <div className="md:col-span-7 relative h-[500px] md:h-[700px]">
            <div className="absolute top-0 left-0 w-[85%] h-[85%] rounded-lg overflow-hidden shadow-sm bg-surface-dim">
              <MediaImage propertySlug="old-trafford" index={0} alt="Old Trafford apartment" />
            </div>
            <div className="absolute bottom-0 right-0 w-[55%] h-[55%] rounded-lg overflow-hidden shadow-2xl z-10 bg-surface-dim border border-outline-variant/30">
              <MediaImage propertySlug="old-trafford" index={1} alt="Old Trafford apartment detail" />
            </div>
          </div>
          <div className="md:col-span-5">
            <span className="inline-block font-body text-label-caps text-secondary mb-6 tracking-widest uppercase">TRAFFORD EXCLUSIVES</span>
            <h2 className="font-display text-headline-md text-primary mb-6">Trafford</h2>
            <p className="font-body text-body-lg text-on-surface-variant mb-10 opacity-90 leading-relaxed">
              A collection of spacious, tranquil retreats on the outskirts of the city bustle. Trafford properties are defined by their generous proportions, lush surroundings, and uncompromising commitment to elegant comfort.
            </p>
            <Link to="/collection/old-trafford" className="inline-flex items-center justify-center border border-primary text-primary px-8 py-4 font-body text-label-caps tracking-widest uppercase hover:bg-surface-dim transition-colors duration-300">
              VIEW DETAILS
            </Link>
          </div>
        </div>
      </section>

      {/* Property Feature: The Collective */}
      <section className="py-section-gap px-margin-mobile md:px-margin-desktop bg-surface-container-low border-y border-outline-variant/30">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-16 lg:gap-24 items-center">
          <div className="md:col-span-5 order-2 md:order-1 mt-12 md:mt-0">
            <span className="inline-block font-body text-label-caps text-secondary mb-6 tracking-widest uppercase">CURATED EXPERIENCES</span>
            <h2 className="font-display text-headline-md text-primary mb-6">The Collective</h2>
            <p className="font-body text-body-lg text-on-surface-variant mb-10 opacity-90 leading-relaxed">
              An exclusive assortment of highly stylized and uniquely positioned properties. The Collective brings together the sharpest design, immersive aesthetics, and premier locations for the ultimate city escape.
            </p>
            <Link to="/collection/the-collective" className="inline-flex items-center justify-center border border-primary text-primary px-8 py-4 font-body text-label-caps tracking-widest uppercase hover:bg-surface-dim transition-colors duration-300">
              EXPLORE DETAILS
            </Link>
          </div>
          <div className="md:col-span-7 order-1 md:order-2">
            <div className="grid grid-cols-2 gap-4 h-[500px] md:h-[700px]">
              <div className="col-span-1 row-span-2 rounded-lg overflow-hidden bg-primary">
                <MediaImage propertySlug="the-collective" index={0} alt="Wood Street Collective room" />
              </div>
              <div className="col-span-1 row-span-1 rounded-lg overflow-hidden bg-surface-dim">
                <MediaImage propertySlug="the-collective" index={1} alt="Wood Street Collective interior detail" />
              </div>
              <div className="col-span-1 row-span-1 rounded-lg overflow-hidden bg-surface-container-lowest flex items-center justify-center p-8 border border-outline-variant/30">
                <p className="font-display text-2xl md:text-3xl text-primary text-center leading-snug">"The sharpest design, immersive aesthetics."</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Properties Map Section - simplified for React structure */}
       <section className="py-section-gap px-margin-mobile md:px-margin-desktop bg-surface">
        <div className="max-w-[1280px] mx-auto flex flex-col lg:flex-row gap-8 lg:gap-16 h-auto lg:h-[800px]">
          <div className="w-full lg:w-1/2 flex flex-col h-full">
            <div className="flex justify-between items-center mb-8">
              <h2 className="font-display text-headline-md text-primary">Discover Our Locations</h2>
              <div className="flex items-center gap-4 relative">
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
                    to={`/collection/${location.propertySlug}`}
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
