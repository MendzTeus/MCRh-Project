import { BedDouble, Bath, PersonStanding } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import AvailabilityWidget from '../components/AvailabilityWidget';
import MediaImage from '../components/MediaImage';
import { getInventoryForProperty } from '../data/airbnbInventory';
import { getListingMedia } from '../data/listingMedia';
import { getPropertyBySlug } from '../data/properties';

export default function CollectionDetail() {
  const { id } = useParams();
  const property = getPropertyBySlug(id) || getPropertyBySlug('chambers');

  if (!property) return null;

  const inventoryUnits = getInventoryForProperty(property.slug);
  const collectionUnits = inventoryUnits.length
    ? inventoryUnits.map((unit) => {
        const media = getListingMedia(unit.unitSlug);
        return {
          slug: unit.unitSlug,
          title: media?.title || unit.unitName,
          label: unit.unitName,
          specs: unit.suppliedSpecs || 'Specs to confirm',
          path: `/properties/${property.slug}/${unit.unitSlug}`,
          imageSrc: media?.primaryImage,
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

  return (
    <div className="animate-in fade-in duration-500">
      <Helmet>
        <title>{property.name} | MCRh Manchester</title>
        <meta name="description" content={`${property.headline} ${property.description}`} />
        <meta property="og:title" content={`${property.name} | MCRh Manchester`} />
        <meta property="og:description" content={property.headline} />
        {property.imageSrc && <meta property="og:image" content={property.imageSrc} />}
      </Helmet>

      {/* Hero Section */}
      <section
        className="w-full h-[80vh] min-h-[600px] relative flex flex-col justify-end pb-margin-desktop px-margin-mobile md:px-margin-desktop bg-surface-dim border-b border-outline-variant/30"
      >
        <div className="absolute inset-0 z-0">
           <MediaImage propertySlug={property.slug} alt={property.imageAlt} loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary-container/80 to-transparent"></div>
        </div>
        <div className="relative z-10 max-w-[1280px] mx-auto w-full">
          <span className="font-body text-label-caps text-secondary-container mb-4 block tracking-widest uppercase">{property.area}</span>
          <h1 className="font-display text-display-lg-mobile md:text-display-lg text-white mb-6 max-w-3xl leading-tight">{property.name}</h1>
          <p className="font-body text-body-lg text-white/80 max-w-2xl text-lg">{property.headline}</p>
        </div>
      </section>

      <AvailabilityWidget propertyName={property.name} maxGuests={property.maxGuests} />

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
      <section className="py-section-gap px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto border-t border-outline-variant/30">
        <div className="mb-12">
          <span className="font-body text-label-caps text-secondary mb-2 block tracking-widest uppercase">{property.eyebrow}</span>
          <h2 className="font-display text-headline-md md:text-display-lg text-primary">{property.name}</h2>
          <p className="mt-6 max-w-2xl font-body text-body-lg text-on-surface-variant">{property.description}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12 mt-12">
          {collectionUnits.map((apt) => {
            const cardContent = (
              <>
              <div className="aspect-[16/9] overflow-hidden rounded mb-4 bg-surface-dim">
                <MediaImage src={apt.imageSrc || undefined} propertySlug={property.slug} alt={apt.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
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
              <Link to={apt.path} key={apt.slug} className="group cursor-pointer block">
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
            <div className="aspect-[16/9] bg-surface-dim rounded-lg flex items-center justify-center overflow-hidden border border-outline-variant/30 relative">
               <div className="absolute inset-0 w-full h-full bg-surface-variant"></div>
               <div className="absolute inset-0 bg-primary/5 mix-blend-multiply pointer-events-none"></div>
               <span className="font-body text-label-caps text-on-surface-variant/50 relative z-10 bg-surface/80 px-4 py-2 rounded">EDITORIAL MAP PLACEHOLDER</span>
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
    </div>
  );
}
