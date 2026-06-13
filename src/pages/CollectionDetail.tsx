import { Bath, BedDouble, Calendar, ChevronDown, PersonStanding } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';
import MediaImage from '../components/MediaImage';
import { getPropertyBySlug } from '../data/properties';

export default function CollectionDetail() {
  const { id } = useParams();
  const property = getPropertyBySlug(id);

  if (!property) {
    return <Navigate to="/properties" replace />;
  }

  return (
    <div className="animate-in fade-in duration-500">
      <section className="w-full h-[80vh] min-h-[600px] relative flex flex-col justify-end pb-margin-desktop px-margin-mobile md:px-margin-desktop bg-surface-dim border-b border-outline-variant/30">
        <div className="absolute inset-0 z-0">
          <MediaImage src={property.imageSrc} alt={property.imageAlt} className="scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary-container/80 to-transparent"></div>
        </div>
        <div className="relative z-10 max-w-[1280px] mx-auto w-full">
          <span className="font-body text-label-caps text-secondary-container mb-4 block tracking-widest uppercase">{property.area}</span>
          <h1 className="font-display text-display-lg-mobile md:text-display-lg text-white mb-6 max-w-3xl leading-tight">{property.name}</h1>
          <p className="font-body text-body-lg text-white/80 max-w-2xl text-lg">{property.headline}</p>
        </div>
      </section>

      <div className="relative z-40 -mt-12 px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto">
        <div className="bg-surface border border-outline-variant/30 rounded-lg p-4 md:p-6 flex flex-col md:flex-row items-center gap-4 md:gap-6 shadow-lg bg-opacity-95 backdrop-blur">
          <div className="flex-1 w-full">
            <label className="font-body text-[10px] mb-1 block uppercase tracking-widest text-on-surface">Property</label>
            <div className="font-body text-on-surface border-b border-outline-variant/30 pb-2 bg-transparent w-full pt-1">
              {property.name}
            </div>
          </div>
          <div className="flex-1 w-full relative">
            <label className="font-body text-[10px] mb-1 block uppercase tracking-widest text-on-surface">Dates</label>
            <div className="font-body text-on-surface border-b border-outline-variant/30 pb-2 flex justify-between items-center cursor-pointer pt-1 hover:border-primary transition-colors">
              <span className="opacity-70">Select dates</span>
              <Calendar className="w-4 h-4 text-on-surface" />
            </div>
          </div>
          <div className="flex-1 w-full">
            <label className="font-body text-[10px] mb-1 block uppercase tracking-widest text-on-surface">Guests</label>
            <div className="font-body text-on-surface border-b border-outline-variant/30 pb-2 flex justify-between items-center cursor-pointer pt-1 hover:border-primary transition-colors">
              <span>{property.maxGuests} Guests</span>
              <ChevronDown className="w-4 h-4 text-on-surface" />
            </div>
          </div>
          <div className="flex flex-col items-center md:items-end gap-2 w-full md:w-auto">
            <Link to="/contact" className="bg-primary-container text-[#C8A45C] border border-[#C8A45C] px-8 py-3 font-body text-label-caps tracking-widest uppercase hover:bg-primary transition-all w-full md:w-auto rounded text-center">
              Check availability
            </Link>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              <span className="font-body text-[10px] text-primary tracking-widest uppercase">Enquiry ready</span>
            </div>
          </div>
        </div>
      </div>

      <section className="border-b border-outline-variant/30 py-6 mt-12 md:mt-16">
        <div className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop flex flex-wrap gap-8 md:gap-16 justify-center md:justify-start">
          <div className="flex items-center gap-3">
            <PersonStanding className="w-5 h-5 text-on-surface-variant" />
            <span className="font-body text-label-caps text-on-surface-variant tracking-widest uppercase">{property.maxGuests} guests</span>
          </div>
          <div className="flex items-center gap-3">
            <BedDouble className="w-5 h-5 text-on-surface-variant" />
            <span className="font-body text-label-caps text-on-surface-variant tracking-widest uppercase">{property.bedrooms} bedrooms</span>
          </div>
          <div className="flex items-center gap-3">
            <BedDouble className="w-5 h-5 text-on-surface-variant" />
            <span className="font-body text-label-caps text-on-surface-variant tracking-widest uppercase">{property.beds} beds</span>
          </div>
          <div className="flex items-center gap-3">
            <Bath className="w-5 h-5 text-on-surface-variant" />
            <span className="font-body text-label-caps text-on-surface-variant tracking-widest uppercase">{property.bathrooms} bathrooms</span>
          </div>
        </div>
      </section>

      <section className="py-section-gap px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16">
          <div className="md:col-span-5">
            <span className="font-body text-label-caps text-secondary mb-2 block tracking-widest uppercase">The Collection</span>
            <h2 className="font-display text-headline-md md:text-display-lg text-primary mb-8">{property.name}</h2>
            <p className="font-body text-body-lg text-on-surface-variant leading-relaxed">{property.description}</p>
          </div>
          <div className="md:col-span-7 grid grid-cols-2 gap-4">
            {property.gallery.slice(0, 4).map((image, index) => (
              <div key={image} className={`${index === 0 ? 'col-span-2 aspect-[16/9]' : 'aspect-square'} rounded-lg overflow-hidden bg-surface-dim`}>
                <MediaImage src={image} alt={`${property.name} photo ${index + 1}`} />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12 mt-20">
          {property.units.map((unit, index) => (
            <Link to={`/properties/${property.slug}/${unit.slug}`} key={unit.slug} className="group cursor-pointer block">
              <div className="aspect-[16/9] overflow-hidden rounded mb-4 bg-surface-dim">
                <MediaImage src={property.gallery[index % property.gallery.length]} alt={unit.title} className="transition-transform duration-700 group-hover:scale-105" />
              </div>
              <div className="flex justify-between items-end gap-6">
                <div>
                  <h3 className="font-display text-headline-sm text-primary">{unit.title}</h3>
                  <p className="font-body text-[10px] text-on-surface-variant tracking-widest uppercase">{unit.label}</p>
                </div>
                <span className="font-body text-label-caps text-primary border-b border-primary pb-1 group-hover:text-secondary group-hover:border-secondary transition-colors uppercase tracking-widest">
                  View Residence
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
