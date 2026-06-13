import { Bath, BedDouble, MapPin, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import MediaImage from '../components/MediaImage';
import { orderedProperties } from '../data/properties';

export default function Properties() {
  const hero = orderedProperties[0];

  return (
    <div className="animate-in fade-in duration-500">
      <section className="relative h-[72vh] min-h-[560px] w-full overflow-hidden flex items-end">
        <div className="absolute inset-0 z-0 bg-surface-dim">
          <MediaImage src={hero.imageSrc} alt={hero.imageAlt} className="scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/30 to-transparent"></div>
        </div>
        <div className="relative z-10 w-full px-margin-mobile md:px-margin-desktop pb-margin-desktop md:pb-section-gap max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-end gap-8">
          <div className="max-w-2xl text-on-primary">
            <h1 className="font-display text-display-lg-mobile md:text-display-lg mb-6 leading-tight text-white">Manchester Short-Let Apartments</h1>
            <p className="font-body text-body-lg opacity-90 max-w-lg text-white/90">Explore MCRh properties across the city centre, Ancoats, Old Trafford and The Collective.</p>
          </div>
          <div className="mt-8 md:mt-0 pb-2">
            <a href="#properties" className="inline-flex items-center justify-center border border-on-primary text-on-primary px-8 py-4 font-body text-label-caps hover:bg-on-primary hover:text-primary transition-colors duration-300 uppercase tracking-widest">
              View All Properties
            </a>
          </div>
        </div>
      </section>

      <section id="properties" className="py-section-gap px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-16">
          <div>
            <span className="font-body text-label-caps text-secondary mb-4 block tracking-widest uppercase">The Portfolio</span>
            <h2 className="font-display text-headline-md text-primary">Six live collections to rebuild from the old roadmap.</h2>
          </div>
          <p className="font-body text-body-md text-on-surface-variant max-w-md">
            These records are now pulled from the old MCRh content model so each page can be completed without hardcoding one-off Chambers layouts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {orderedProperties.map((property) => (
            <Link
              key={property.slug}
              to={`/properties/${property.slug}`}
              className="group bg-surface-container-lowest border border-outline-variant/30 rounded-xl overflow-hidden hover:border-primary transition-colors"
            >
              <div className="aspect-[16/10] overflow-hidden bg-surface-dim">
                <MediaImage src={property.imageSrc} alt={property.imageAlt} className="transition-transform duration-700 group-hover:scale-105" />
              </div>
              <div className="p-6 md:p-8">
                <div className="flex items-center gap-2 font-body text-[10px] text-secondary tracking-widest uppercase mb-4">
                  <MapPin className="w-3.5 h-3.5" />
                  {property.area}
                </div>
                <h3 className="font-display text-headline-sm text-primary mb-3">{property.name}</h3>
                <p className="font-body text-body-md text-on-surface-variant leading-relaxed mb-6">{property.description}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-outline-variant/30">
                  <span className="flex items-center gap-2 text-sm text-on-surface-variant"><Users className="w-4 h-4" /> {property.maxGuests} guests</span>
                  <span className="flex items-center gap-2 text-sm text-on-surface-variant"><BedDouble className="w-4 h-4" /> {property.bedrooms} beds</span>
                  <span className="flex items-center gap-2 text-sm text-on-surface-variant"><Bath className="w-4 h-4" /> {property.bathrooms} baths</span>
                  <span className="font-body text-label-caps text-primary tracking-widest uppercase">View</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
