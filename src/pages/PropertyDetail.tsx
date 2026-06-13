import { ArrowLeft, Bath, BedDouble, ChefHat, Coffee, Snowflake, Star, Wifi } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';
import MediaImage from '../components/MediaImage';
import { getUnitBySlug } from '../data/properties';

export default function PropertyDetail() {
  const { id } = useParams();
  const result = getUnitBySlug(id);

  if (!result) {
    return <Navigate to="/properties" replace />;
  }

  const { property, unit } = result;
  const heroImage = property.gallery[0];

  return (
    <div className="animate-in fade-in duration-500">
      <section className="relative w-full h-[760px] md:h-[860px] flex items-end pb-section-gap">
        <div className="absolute inset-0 z-0 bg-surface-dim">
          <MediaImage src={heroImage} alt={unit.title} className="scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent"></div>
        </div>

        <div className="relative z-10 w-full max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row justify-between items-end gap-gutter">
          <div className="text-white w-full md:w-2/3">
            <Link to={`/properties/${property.slug}`} className="inline-flex items-center gap-2 font-body text-label-caps tracking-widest mb-8 opacity-80 uppercase hover:opacity-100">
              <ArrowLeft className="w-4 h-4" /> Back to {property.name}
            </Link>
            <p className="font-body text-label-caps tracking-widest mb-4 opacity-80 uppercase">{unit.label}</p>
            <h1 className="font-display text-display-lg-mobile md:text-display-lg mb-6 leading-tight">{unit.title}</h1>
            <p className="font-body text-body-lg opacity-90 max-w-2xl">{unit.description}</p>
          </div>

          <div className="w-full md:w-1/3 bg-surface p-8 rounded-xl shadow-2xl translate-y-1/2 md:translate-y-1/4 backdrop-blur-md bg-opacity-95 border border-outline-variant/20">
            <div className="flex justify-between items-center mb-6 border-b border-outline-variant/30 pb-4">
              <p className="font-body text-body-md text-on-surface-variant">{unit.specs}</p>
              <div className="flex items-center gap-1 text-on-surface-variant">
                <Star className="w-4 h-4 fill-current text-secondary" />
                <span className="font-body text-body-md font-semibold">4.98</span>
              </div>
            </div>

            <Link to="/contact" className="block w-full py-4 bg-primary text-on-primary font-body text-label-caps tracking-widest hover:opacity-90 transition-opacity uppercase rounded text-center">
              Book With MCRh
            </Link>
            <a href="https://wa.me/447957785614" className="block w-full mt-3 py-4 border border-primary text-primary font-body text-label-caps tracking-widest hover:bg-surface-container transition-colors uppercase rounded text-center">
              WhatsApp Us
            </a>
            <p className="text-center font-body text-sm text-on-surface-variant mt-4">We will confirm availability before charging.</p>
          </div>
        </div>
      </section>

      <section className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-section-gap grid grid-cols-1 md:grid-cols-12 gap-gutter mt-16 md:mt-24">
        <div className="md:col-span-7 space-y-12">
          <div>
            <h2 className="font-display text-headline-md text-primary mb-6">The Space</h2>
            <div className="font-body text-on-surface-variant text-body-lg space-y-6">
              <p>{property.description}</p>
              <p>{unit.description}</p>
            </div>
          </div>

          <div className="border-t border-outline-variant/30 pt-12">
            <h3 className="font-display text-headline-sm text-primary mb-8">Amenities</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
              {property.amenities.slice(0, 6).map((amenity, index) => {
                const icons = [BedDouble, Wifi, ChefHat, Coffee, Snowflake, Bath];
                const Icon = icons[index % icons.length];
                return (
                  <div key={amenity} className="flex items-center gap-4">
                    <Icon className="w-8 h-8 text-on-surface-variant font-light" strokeWidth={1} />
                    <span className="font-body text-body-lg text-on-surface">{amenity}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-section-gap">
        <h2 className="font-display text-headline-md text-primary mb-12">Visual Journey</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 h-auto md:h-[760px]">
          <div className="md:col-span-2 h-[420px] md:h-full rounded-xl overflow-hidden relative group">
            <MediaImage src={property.gallery[0]} alt={`${unit.title} main room`} />
          </div>
          <div className="grid grid-rows-3 gap-4 h-[760px] md:h-full">
            {property.gallery.slice(1, 4).map((image, index) => (
              <div key={image} className="rounded-xl overflow-hidden relative group h-full">
                <MediaImage src={image} alt={`${unit.title} gallery ${index + 2}`} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
