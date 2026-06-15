import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import MediaImage from '../components/MediaImage';
import PropertyFeatureSection from '../components/PropertyFeatureSection';

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

      <PropertyFeatureSection
        propertySlug="chambers"
        eyebrow="Featured Property"
        name="Chambers Residence"
        description="Experience the perfect blend of Manchester's rich industrial heritage and contemporary luxury. Located in the heart of the city, Chambers Residence offers a serene escape with bespoke furnishings, towering ceilings, and an atmosphere of curated calm."
        collectionSlug="chambers"
        cta="Book Now"
        imageLayout="stack"
        sectionId="chambers"
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
      />

      <PropertyFeatureSection
        propertySlug="wood-street"
        eyebrow="Wood Street Collection"
        name="Wood Street"
        description="Situated in a vibrant, historic quarter, Wood Street properties offer an unmatched blend of privacy and proximity to Manchester's cultural landmarks. Featuring tailored interiors, warm wood tones, and expansive natural light."
        collectionSlug="wood-street"
        cta="View Details"
        imageLayout="stack"
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
      />

      <PropertyFeatureSection
        propertySlug="old-trafford"
        eyebrow="Trafford Exclusives"
        name="Trafford"
        description="A collection of spacious, tranquil retreats on the outskirts of the city bustle. Trafford properties are defined by their generous proportions, lush surroundings, and uncompromising commitment to elegant comfort."
        collectionSlug="old-trafford"
        cta="View Details"
        imageLayout="stack"
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
      />
    </div>
  );
}
