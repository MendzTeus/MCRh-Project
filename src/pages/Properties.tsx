import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import MediaImage from '../components/MediaImage';

export default function Properties() {
  return (
    <div className="animate-in fade-in duration-500">
      <Helmet>
        <title>Properties | MCRh Manchester Short-Let Apartments</title>
        <meta name="description" content="Browse MCRh's curated portfolio of short-let apartments in Manchester — Chambers, John Dalton Street, Wood Street, Ancoats, Old Trafford and The Collective." />
        <meta property="og:title" content="Properties | MCRh Manchester" />
        <meta property="og:description" content="Curated short-let apartments in Manchester's prime locations." />
        <meta property="og:type" content="website" />
      </Helmet>

      {/* Hero Section */}
      <section className="relative h-screen w-full overflow-hidden flex items-end">
        <div className="absolute inset-0 z-0 bg-surface-dim">
           <MediaImage propertySlug="chambers" alt="MCRh Manchester apartment interior" loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/30 to-transparent"></div>
        </div>
        <div className="relative z-10 w-full px-margin-mobile md:px-margin-desktop pb-margin-desktop md:pb-section-gap max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-end">
          <div className="max-w-2xl text-on-primary">
            <h1 className="font-display text-display-lg-mobile md:text-display-lg mb-6 leading-tight text-white">Experts In Short-Term Lettings</h1>
            <p className="font-body text-body-lg opacity-90 max-w-lg text-white/90">The first choice for property rentals & hosting in Manchester</p>
          </div>
          <div className="mt-8 md:mt-0 pb-2">
            <a href="#chambers" className="inline-flex items-center justify-center border border-on-primary text-on-primary px-8 py-4 font-body text-label-caps hover:bg-on-primary hover:text-primary transition-colors duration-300 uppercase tracking-widest text-white border-white">
              EXPLORE PROPERTIES
            </a>
          </div>
        </div>
      </section>

      {/* Property Feature: Chambers Residence */}
      <section id="chambers" className="py-section-gap px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-center">
          <div className="md:col-span-7 relative h-[600px] md:h-[800px]">
            <div className="absolute top-0 left-0 w-[85%] h-[85%] rounded-lg overflow-hidden shadow-sm bg-surface-dim">
              <MediaImage propertySlug="chambers" index={0} alt="Chambers Residence apartment" />
            </div>
            <div className="absolute bottom-0 right-0 w-[55%] h-[55%] rounded-lg overflow-hidden shadow-2xl md:-mr-8 z-10 bg-surface-dim border border-outline-variant/30">
              <MediaImage propertySlug="chambers" index={1} alt="Chambers Residence bedroom detail" />
            </div>
          </div>
          <div className="md:col-span-5 md:pl-12 mt-12 md:mt-0">
            <span className="inline-block font-body text-label-caps text-secondary mb-4 tracking-widest uppercase">FEATURED PROPERTY</span>
            <h2 className="font-display text-headline-md text-primary mb-6">Chambers Residence</h2>
            <p className="font-body text-body-md text-on-surface-variant mb-8 opacity-80 leading-relaxed">
              Experience the perfect blend of Manchester's rich industrial heritage and contemporary luxury. Located in the heart of the city, Chambers Residence offers a serene escape with bespoke furnishings, towering ceilings, and an atmosphere of curated calm.
            </p>
            <Link to="/collection/chambers" className="inline-flex items-center justify-center border border-primary text-primary px-8 py-4 font-body text-label-caps hover:bg-surface-variant transition-colors duration-300 uppercase tracking-widest">
              BOOK NOW
            </Link>
          </div>
        </div>
      </section>

      {/* Property Feature: John Dalton Street */}
      <section className="py-section-gap px-margin-mobile md:px-margin-desktop bg-surface-container-low border-y border-outline-variant/30">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-center">
          <div className="md:col-span-5 md:pr-12 order-2 md:order-1 mt-12 md:mt-0">
            <span className="inline-block font-body text-label-caps text-secondary mb-4 tracking-widest uppercase">HERITAGE COLLECTION</span>
            <h2 className="font-display text-headline-md text-primary mb-6">John Dalton Street</h2>
            <p className="font-body text-body-md text-on-surface-variant mb-8 opacity-80 leading-relaxed">
              Set within a meticulously restored historic building, this residence celebrates architectural grandeur while providing uncompromising modern comfort. Expansive arched windows frame city views, while tactile brickwork and rich textiles create a deeply comforting environment.
            </p>
            <Link to="/collection/john-dalton-st" className="inline-flex items-center justify-center border border-primary text-primary px-8 py-4 font-body text-label-caps hover:bg-surface-variant transition-colors duration-300 uppercase tracking-widest">
              EXPLORE DETAILS
            </Link>
          </div>
          <div className="md:col-span-7 order-1 md:order-2">
            <div className="grid grid-cols-2 gap-4 h-[600px] md:h-[700px]">
              <div className="col-span-1 row-span-2 rounded-lg overflow-hidden bg-surface-dim">
                <MediaImage propertySlug="john-dalton-st" index={0} alt="John Dalton Street apartment" />
              </div>
              <div className="col-span-1 row-span-1 rounded-lg overflow-hidden bg-surface-dim">
                <MediaImage propertySlug="john-dalton-st" index={1} alt="John Dalton Street interior detail" />
              </div>
              <div className="col-span-1 row-span-1 rounded-lg overflow-hidden bg-surface-variant flex items-center justify-center p-8 border border-outline-variant/30">
                <p className="font-display text-2xl md:text-3xl text-primary text-center leading-snug">"A masterclass in urban sanctuary."</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Property Feature: Wood Street */}
      <section className="py-section-gap px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-center">
          <div className="md:col-span-7 relative h-[600px] md:h-[800px]">
            <div className="absolute top-0 left-0 w-[85%] h-[85%] rounded-lg overflow-hidden shadow-sm bg-surface-dim">
              <MediaImage propertySlug="wood-street" index={0} alt="Wood Street apartment" />
            </div>
            <div className="absolute bottom-0 right-0 w-[55%] h-[55%] rounded-lg overflow-hidden shadow-2xl z-10 bg-surface-dim border border-outline-variant/30">
                <MediaImage propertySlug="wood-street" index={1} alt="Wood Street apartment detail" />
            </div>
          </div>
          <div className="md:col-span-5 md:pl-12 mt-12 md:mt-0">
            <span className="inline-block font-body text-label-caps text-secondary mb-4 tracking-widest uppercase">WOOD STREET COLLECTION</span>
            <h2 className="font-display text-headline-md text-primary mb-6">Wood Street</h2>
            <p className="font-body text-body-md text-on-surface-variant mb-8 opacity-80 leading-relaxed">
              Situated in a vibrant, historic quarter, Wood Street properties offer an unmatched blend of privacy and proximity to Manchester's cultural landmarks. Featuring tailored interiors, warm wood tones, and expansive natural light.
            </p>
            <Link to="/collection/wood-street" className="inline-flex items-center justify-center border border-primary text-primary px-8 py-4 font-body text-label-caps hover:bg-surface-variant transition-colors duration-300 uppercase tracking-widest">
              VIEW DETAILS
            </Link>
          </div>
        </div>
      </section>

      {/* Property Feature: Ancoats */}
      <section className="py-section-gap px-margin-mobile md:px-margin-desktop bg-surface-container-low border-y border-outline-variant/30">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-center">
          <div className="md:col-span-5 md:pr-12 order-2 md:order-1 mt-12 md:mt-0">
            <span className="inline-block font-body text-label-caps text-secondary mb-4 tracking-widest uppercase">ANCOATS DISTRICT</span>
            <h2 className="font-display text-headline-md text-primary mb-6">Ancoats</h2>
            <p className="font-body text-body-md text-on-surface-variant mb-8 opacity-80 leading-relaxed">
              Embrace the spirit of innovation in Ancoats. These residences lean into their industrial roots with polished concrete, exposed beams, and contemporary art, creating a dynamic yet refined living space for the modern traveler.
            </p>
            <Link to="/collection/ancoats" className="inline-flex items-center justify-center border border-primary text-primary px-8 py-4 font-body text-label-caps hover:bg-surface-variant transition-colors duration-300 uppercase tracking-widest">
              EXPLORE DETAILS
            </Link>
          </div>
          <div className="md:col-span-7 order-1 md:order-2">
            <div className="grid grid-cols-2 gap-4 h-[600px] md:h-[700px]">
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
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-center">
          <div className="md:col-span-7 relative h-[600px] md:h-[800px]">
            <div className="absolute top-0 left-0 w-[85%] h-[85%] rounded-lg overflow-hidden shadow-sm bg-surface-dim">
              <MediaImage propertySlug="old-trafford" index={0} alt="Old Trafford apartment" />
            </div>
            <div className="absolute bottom-0 right-0 w-[55%] h-[55%] rounded-lg overflow-hidden shadow-2xl md:-mr-8 z-10 bg-surface-dim border border-outline-variant/30">
              <MediaImage propertySlug="old-trafford" index={1} alt="Old Trafford apartment detail" />
            </div>
          </div>
          <div className="md:col-span-5 md:pl-12 mt-12 md:mt-0">
            <span className="inline-block font-body text-label-caps text-secondary mb-4 tracking-widest uppercase">TRAFFORD EXCLUSIVES</span>
            <h2 className="font-display text-headline-md text-primary mb-6">Trafford</h2>
            <p className="font-body text-body-md text-on-surface-variant mb-8 opacity-80 leading-relaxed">
              A collection of spacious, tranquil retreats on the outskirts of the city bustle. Trafford properties are defined by their generous proportions, lush surroundings, and uncompromising commitment to elegant comfort.
            </p>
            <Link to="/collection/old-trafford" className="inline-flex items-center justify-center border border-primary text-primary px-8 py-4 font-body text-label-caps hover:bg-surface-variant transition-colors duration-300 uppercase tracking-widest">
              VIEW DETAILS
            </Link>
          </div>
        </div>
      </section>

      {/* Property Feature: The Collective */}
      <section className="py-section-gap px-margin-mobile md:px-margin-desktop bg-surface-container-low border-y border-outline-variant/30">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-center">
          <div className="md:col-span-5 md:pr-12 order-2 md:order-1 mt-12 md:mt-0">
            <span className="inline-block font-body text-label-caps text-secondary mb-4 tracking-widest uppercase">CURATED EXPERIENCES</span>
            <h2 className="font-display text-headline-md text-primary mb-6">The Collective</h2>
            <p className="font-body text-body-md text-on-surface-variant mb-8 opacity-80 leading-relaxed">
              An exclusive assortment of highly stylized and uniquely positioned properties. The Collective brings together the sharpest design, immersive aesthetics, and premier locations for the ultimate city escape.
            </p>
            <Link to="/collection/the-collective" className="inline-flex items-center justify-center border border-primary text-primary px-8 py-4 font-body text-label-caps hover:bg-surface-variant transition-colors duration-300 uppercase tracking-widest">
              EXPLORE DETAILS
            </Link>
          </div>
          <div className="md:col-span-7 order-1 md:order-2">
            <div className="grid grid-cols-2 gap-4 h-[600px] md:h-[700px]">
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
    </div>
  );
}
