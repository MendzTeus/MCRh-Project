import { Plus, Minus, SlidersHorizontal as Tune, Quote } from 'lucide-react';
import { Link } from 'react-router-dom';
import MediaImage from '../components/MediaImage';
import { orderedProperties, type Property } from '../data/properties';

function PropertyFeature({ property, reversed = false }: { property: Property; reversed?: boolean }) {
  if (reversed) {
    return (
      <section className="bg-surface-container-low border-y border-outline-variant/30 py-section-gap px-margin-mobile md:px-margin-desktop">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-16 lg:gap-24 items-center">
          <div className="md:col-span-5 order-2 md:order-1">
            <span className="inline-block font-body text-label-caps text-secondary mb-6 tracking-widest uppercase">{property.eyebrow}</span>
            <h2 className="font-display text-headline-md text-primary mb-6">{property.name}</h2>
            <p className="font-body text-body-lg text-on-surface-variant mb-10 opacity-90 leading-relaxed">{property.description}</p>
            <Link to={`/properties/${property.slug}`} className="inline-flex items-center justify-center border border-primary text-primary px-8 py-4 font-body text-label-caps tracking-widest uppercase hover:bg-surface-dim transition-colors duration-300">
              Explore Details
            </Link>
          </div>

          <div className="md:col-span-7 order-1 md:order-2">
            <div className="grid grid-cols-2 gap-4 h-[500px] md:h-[700px]">
              <div className="col-span-1 row-span-2 rounded-lg overflow-hidden bg-surface-dim">
                <MediaImage src={property.gallery[0]} alt={property.imageAlt} />
              </div>
              <div className="col-span-1 row-span-1 rounded-lg overflow-hidden bg-surface-dim">
                <MediaImage src={property.gallery[1] ?? property.gallery[0]} alt={`${property.name} detail`} />
              </div>
              <div className="col-span-1 row-span-1 rounded-lg overflow-hidden bg-surface-container-lowest flex items-center justify-center p-8 border border-outline-variant/30">
                <p className="font-display text-2xl md:text-3xl text-primary text-center leading-snug">"{property.quote}"</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-surface py-section-gap px-margin-mobile md:px-margin-desktop">
      <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-16 lg:gap-24 items-center">
        <div className="md:col-span-7 relative h-[500px] md:h-[700px] order-1">
          <div className="absolute top-0 left-0 w-[85%] h-[85%] rounded-lg overflow-hidden shadow-sm bg-surface-dim">
            <MediaImage src={property.gallery[0]} alt={property.imageAlt} />
          </div>
          <div className="absolute bottom-0 right-0 w-[55%] h-[55%] rounded-lg overflow-hidden shadow-2xl z-10 bg-surface-dim border border-outline-variant/30">
            <MediaImage src={property.gallery[1] ?? property.gallery[0]} alt={`${property.name} detail`} />
          </div>
        </div>

        <div className="md:col-span-5 order-2">
          <span className="inline-block font-body text-label-caps text-secondary mb-6 tracking-widest uppercase">{property.eyebrow}</span>
          <h2 className="font-display text-headline-md text-primary mb-6">{property.name}</h2>
          <p className="font-body text-body-lg text-on-surface-variant mb-10 opacity-90 leading-relaxed">{property.description}</p>
          <Link to={`/properties/${property.slug}`} className="inline-flex items-center justify-center border border-primary text-primary px-8 py-4 font-body text-label-caps tracking-widest uppercase hover:bg-surface-dim transition-colors duration-300">
            Book Now
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const [heroProperty, ...rest] = orderedProperties;

  return (
    <div className="animate-in fade-in duration-500">
      <section className="relative h-[90vh] min-h-[600px] w-full overflow-hidden flex items-end">
        <div className="absolute inset-0 z-0 bg-surface-dim">
          <MediaImage src={heroProperty.imageSrc} alt={heroProperty.imageAlt} className="scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/40 to-primary/10"></div>
        </div>
        <div className="relative z-10 w-full px-margin-mobile md:px-margin-desktop pb-12 md:pb-24 max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-end gap-8">
          <div className="max-w-3xl text-white">
            <h1 className="font-display text-display-lg-mobile md:text-display-lg text-white mb-6 leading-[1.1]">Experts In Short-Term Lettings</h1>
            <p className="font-body text-body-lg text-white/90 max-w-lg text-lg">The first choice for property rentals & hosting in Manchester.</p>
          </div>
          <div className="pb-2 w-full md:w-auto">
            <Link to="/properties" className="w-full md:w-auto inline-flex items-center justify-center border border-white text-white px-8 py-4 font-body text-label-caps tracking-widest uppercase hover:bg-white hover:text-primary transition-colors duration-300">
              Explore Properties
            </Link>
          </div>
        </div>
      </section>

      <PropertyFeature property={heroProperty} />
      {rest.map((property, index) => (
        <div key={property.slug}>
          <PropertyFeature property={property} reversed={index % 2 === 0} />
        </div>
      ))}

      <section className="py-section-gap px-margin-mobile md:px-margin-desktop bg-surface">
        <div className="max-w-[1280px] mx-auto flex flex-col lg:flex-row gap-8 lg:gap-16 h-auto lg:h-[760px]">
          <div className="w-full lg:w-1/2 flex flex-col h-full">
            <div className="flex justify-between items-center mb-8 gap-4">
              <h2 className="font-display text-headline-md text-primary">Discover Our Locations</h2>
              <button className="flex items-center gap-2 border border-outline-variant/60 px-4 py-2 rounded-full font-body text-label-caps tracking-widest uppercase hover:bg-surface-dim transition-colors">
                <Tune className="w-4 h-4" /> Filters
              </button>
            </div>

            <div className="overflow-y-auto pr-4 pb-4 space-y-6 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {orderedProperties.map((property) => (
                  <Link key={property.slug} to={`/properties/${property.slug}`} className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm border border-outline-variant/30 group cursor-pointer hover:border-primary transition-all duration-300">
                    <div className="aspect-[4/3] bg-surface-dim relative overflow-hidden">
                      <MediaImage src={property.imageSrc} alt={property.imageAlt} className="transition-transform duration-700 group-hover:scale-105" />
                    </div>
                    <div className="p-6">
                      <h3 className="font-display text-lg mb-1 text-primary">{property.name}</h3>
                      <p className="font-body text-sm text-on-surface-variant">{property.area}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="w-full lg:w-1/2 h-[500px] lg:h-full rounded-2xl overflow-hidden relative border border-outline-variant/30 bg-surface-variant opacity-90">
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.06)_1px,transparent_1px),linear-gradient(rgba(0,0,0,.06)_1px,transparent_1px)] bg-[size:48px_48px]"></div>
            <div className="absolute top-6 left-6 flex flex-col gap-2">
              <button className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center border border-outline-variant/30 text-primary">
                <Plus className="w-5 h-5" />
              </button>
              <button className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center border border-outline-variant/30 text-primary">
                <Minus className="w-5 h-5" />
              </button>
            </div>
            {orderedProperties.map((property, index) => (
              <Link
                key={property.slug}
                to={`/properties/${property.slug}`}
                className="absolute z-10 cursor-pointer group"
                style={{
                  top: `${34 + (index % 3) * 14}%`,
                  left: `${28 + (index % 4) * 12}%`,
                }}
              >
                <span className="block w-4 h-4 bg-primary rounded-full shadow-md border border-white group-hover:scale-125 transition-transform"></span>
                <span className="absolute left-5 -top-2 whitespace-nowrap rounded bg-surface px-3 py-1 font-body text-[10px] uppercase tracking-widest opacity-0 shadow group-hover:opacity-100 transition-opacity">
                  {property.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-section-gap bg-surface-container-lowest border-t border-outline-variant/30">
        <div className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="text-center mb-16 md:mb-24">
            <span className="font-body text-label-caps text-secondary mb-4 block tracking-widest uppercase">Testimonials</span>
            <h2 className="font-display text-headline-md text-primary">Guest Experiences</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-12 lg:gap-24">
            {[
              ['Emma T.', 'Chambers Residence', 'Every detail of the apartment was thoughtfully curated, from the linens to the local guide provided.'],
              ['James R.', 'John Dalton Street', 'A beautiful city base, central without feeling hectic. The apartment had real character.'],
              ['Sophia M.', 'Ancoats', 'Great location, comfortable layout and exactly the kind of calm place we needed after long days out.'],
            ].map(([name, stay, text]) => (
              <div key={name} className="flex flex-col items-center text-center">
                <Quote className="w-10 h-10 text-outline-variant mb-8 opacity-40 shrink-0" />
                <p className="font-display text-xl md:text-2xl leading-relaxed text-primary mb-12 grow">"{text}"</p>
                <div className="flex flex-col items-center border-t border-outline-variant/30 pt-8 mt-auto w-32">
                  <p className="font-body text-label-caps tracking-widest text-primary uppercase mb-2 whitespace-nowrap">{name}</p>
                  <p className="font-body text-sm text-on-surface-variant whitespace-nowrap">{stay}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
