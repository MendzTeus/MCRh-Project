import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import BeforeAfterSlider from '../components/BeforeAfterSlider';
import MediaImage from '../components/MediaImage';
import { useSiteContent, text, list } from '../hooks/useSiteContent';

const DESIGN_BEFORE_FALLBACK = 'https://stohldealawpbimkgpeb.supabase.co/storage/v1/object/public/property-media/site/design.before/before.jpeg';
const DESIGN_AFTER_FALLBACK = 'https://stohldealawpbimkgpeb.supabase.co/storage/v1/object/public/property-media/site/design.after/after.jpeg';

export default function DesignServices() {
  const site = useSiteContent();
  return (
    <div className="animate-in fade-in duration-500">
      <Helmet>
        <title>{text(site.content, 'seo.design.title', 'Design Services | MCRh Interior Architecture Manchester')}</title>
        <meta name="description" content={text(site.content, 'seo.design.description', 'MCRh Studio — interior architecture and design for short-term rental properties in Manchester. Turnkey furnishing, spatial planning and material selection.')} />
        <meta property="og:title" content={text(site.content, 'seo.design.ogTitle', 'MCRh Design Studio | Interior Architecture Manchester')} />
      </Helmet>

      <section className="relative w-full h-[60vh] min-h-[500px] flex items-center justify-center bg-surface-container-low overflow-hidden">
        <div className="absolute inset-0 z-0">
          {site.images['design.hero']
            ? <img src={site.images['design.hero'].url} alt={site.images['design.hero'].alt || 'MCRh interior design'} className="h-full w-full object-cover" />
            : <MediaImage propertySlug="chambers" index={3} alt="MCRh interior design — Chambers Residence" className="h-full w-full object-cover" />}
          <div className="absolute inset-0 bg-surface-container-low/80"></div>
        </div>
        <div className="relative z-10 text-center max-w-3xl px-6">
          <span className="font-body text-label-caps text-secondary block mb-6 tracking-widest uppercase">{text(site.content, 'design.hero.eyebrow', 'MCRh Studio')}</span>
          <h1 className="font-display text-display-lg-mobile md:text-display-lg text-primary mb-6">{text(site.content, 'design.hero.title', 'Interior Architecture & Design')}</h1>
          <p className="font-body text-body-lg text-on-surface-variant max-w-2xl mx-auto">
            {text(site.content, 'design.hero.paragraph', 'Crafting spaces that elevate the short-term rental experience. We design for longevity, functional elegance, and unforgettable guest impressions.')}
          </p>
        </div>
      </section>

      <section className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-section-gap">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-32 items-center">
          <div>
            <span className="font-body text-label-caps text-secondary mb-4 block tracking-widest uppercase">{text(site.content, 'design.approach.eyebrow', 'Our Approach')}</span>
            <h2 className="font-display text-headline-md text-primary mb-6">{text(site.content, 'design.approach.title', 'Intentional Design for Hospitality')}</h2>
            <div className="font-body text-on-surface-variant space-y-6">
              <p>{text(site.content, 'design.approach.p1', 'We believe that a successful short-term rental is not merely decorated; it is meticulously designed to anticipate guest needs while offering a distinct aesthetic narrative.')}</p>
              <p>{text(site.content, 'design.approach.p2', 'Our studio blends residential comfort with boutique hotel durability, ensuring your investment not only stands out in a crowded market but withstands the rigors of constant use.')}</p>
            </div>
            <ul className="mt-8 space-y-4 font-body text-on-surface">
              {list<{item:string}>(site.content, 'design.approach.bullets', [{item:'Market-driven aesthetic optimization'},{item:'Durable, high-yield material selection'},{item:'Complete turnkey furnishing solutions'}]).map((b, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                  <span>{b.item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="aspect-[4/5] bg-surface-dim rounded-xl overflow-hidden relative z-10">
              {site.images['design.approach']
                ? <img src={site.images['design.approach'].url} alt={site.images['design.approach'].alt || 'MCRh interior design approach'} className="h-full w-full object-cover" />
                : <MediaImage propertySlug="ancoats" index={1} alt="MCRh interior design approach — Ancoats apartment" className="h-full w-full object-cover" />}
            </div>
            <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-secondary-container rounded-full mix-blend-multiply opacity-50 blur-2xl z-0"></div>
          </div>
        </div>
      </section>

      <section className="bg-surface-container-lowest border-y border-outline-variant/30 py-section-gap">
        <div className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="font-body text-label-caps text-secondary mb-5 tracking-widest uppercase">
              {text(site.content, 'design.comparison.eyebrow', 'Our Design Services')}
            </h2>
            <p className="font-display text-headline-md text-primary max-w-3xl mx-auto leading-tight">
              {text(site.content, 'design.comparison.paragraph', 'We create thoughtfully designed interiors for apartments and short-stay properties, combining style, comfort and functionality.')}
            </p>
          </div>
          <BeforeAfterSlider
            beforeSrc={site.images['design.before']?.url || DESIGN_BEFORE_FALLBACK}
            beforeAlt={site.images['design.before']?.alt || 'Apartment interior before the MCRh design transformation'}
            afterSrc={site.images['design.after']?.url || DESIGN_AFTER_FALLBACK}
            afterAlt={site.images['design.after']?.alt || 'Apartment interior after the MCRh design transformation'}
          />
          <p className="mt-5 text-center font-body text-xs uppercase tracking-[0.18em] text-on-surface-variant">
            Drag to reveal the transformation
          </p>
        </div>
      </section>

      <section className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-section-gap">
        <div className="bg-primary-container text-on-primary-container rounded-2xl p-12 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-display text-headline-md text-white mb-6">{text(site.content, 'design.cta.title', 'Ready to transform your property?')}</h2>
              <p className="font-body text-body-lg mb-8 max-w-md text-white/80">{text(site.content, 'design.cta.paragraph', "Book a consultation to discuss how our design studio can elevate your asset's nightly rate and occupancy.")}</p>
              <Link to={text(site.content, 'design.cta.ctaHref', '/contact?inquiry=design')} className="inline-block bg-white text-primary px-8 py-4 font-body text-label-caps tracking-widest uppercase hover:bg-surface-dim transition-colors">
                {text(site.content, 'design.cta.ctaLabel', 'Enquire Now')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
