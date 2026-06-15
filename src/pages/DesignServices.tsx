import { ArrowRight, SlidersHorizontal, Check, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import MediaImage from '../components/MediaImage';

export default function DesignServices() {
  return (
    <div className="animate-in fade-in duration-500">
      <Helmet>
        <title>Design Services | MCRh Interior Architecture Manchester</title>
        <meta name="description" content="MCRh Studio — interior architecture and design for short-term rental properties in Manchester. Turnkey furnishing, spatial planning and material selection." />
        <meta property="og:title" content="MCRh Design Studio | Interior Architecture Manchester" />
      </Helmet>

      <section className="relative w-full h-[60vh] min-h-[500px] flex items-center justify-center bg-surface-container-low overflow-hidden">
        <div className="absolute inset-0 z-0">
          <MediaImage propertySlug="chambers" index={3} alt="MCRh interior design — Chambers Residence" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-surface-container-low/80"></div>
        </div>
        <div className="relative z-10 text-center max-w-3xl px-6">
          <span className="font-body text-label-caps text-secondary block mb-6 tracking-widest uppercase">MCRh Studio</span>
          <h1 className="font-display text-display-lg-mobile md:text-display-lg text-primary mb-6">Interior Architecture & Design</h1>
          <p className="font-body text-body-lg text-on-surface-variant max-w-2xl mx-auto">
            Crafting spaces that elevate the short-term rental experience. We design for longevity, functional elegance, and unforgettable guest impressions.
          </p>
        </div>
      </section>

      <section className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-section-gap">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-32 items-center">
          <div>
            <span className="font-body text-label-caps text-secondary mb-4 block tracking-widest uppercase">Our Approach</span>
            <h2 className="font-display text-headline-md text-primary mb-6">Intentional Design for Hospitality</h2>
            <div className="font-body text-on-surface-variant space-y-6">
              <p>We believe that a successful short-term rental is not merely decorated; it is meticulously designed to anticipate guest needs while offering a distinct aesthetic narrative.</p>
              <p>Our studio blends residential comfort with boutique hotel durability, ensuring your investment not only stands out in a crowded market but withstands the rigors of constant use.</p>
            </div>
            <ul className="mt-8 space-y-4 font-body text-on-surface">
              {['Market-driven aesthetic optimization', 'Durable, high-yield material selection', 'Complete turnkey furnishing solutions'].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="aspect-[4/5] bg-surface-dim rounded-xl overflow-hidden relative z-10">
              <MediaImage propertySlug="ancoats" index={1} alt="MCRh interior design approach — Ancoats apartment" className="h-full w-full object-cover" />
            </div>
            <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-secondary-container rounded-full mix-blend-multiply opacity-50 blur-2xl z-0"></div>
          </div>
        </div>
      </section>

      <section className="bg-surface-container-lowest border-y border-outline-variant/30 py-section-gap">
        <div className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="text-center mb-16">
            <h2 className="font-display text-headline-md text-primary mb-4">Core Disciplines</h2>
            <p className="font-body text-on-surface-variant max-w-2xl mx-auto">From initial concept to final installation, we handle every layer of the design process.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: SlidersHorizontal, title: 'Spatial Planning', desc: 'Optimizing layouts for guest flow, luggage storage, and multi-functional use.' },
              { icon: ShieldCheck, title: 'Material Selection', desc: 'Sourcing surfaces and fabrics that balance premium feel with extreme durability.' },
              { icon: ArrowRight, title: 'FF&E Procurement', desc: 'Managing the end-to-end supply chain of Furniture, Fixtures, and Equipment.' }
            ].map((discipline, i) => (
              <div key={i} className="p-8 bg-surface rounded-xl border border-outline-variant/30 hover:border-primary transition-colors group">
                <discipline.icon className="w-8 h-8 text-secondary mb-6 group-hover:scale-110 transition-transform" />
                <h3 className="font-display text-headline-sm text-primary mb-4">{discipline.title}</h3>
                <p className="font-body text-on-surface-variant leading-relaxed">{discipline.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-section-gap">
        <div className="bg-primary-container text-on-primary-container rounded-2xl p-12 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-display text-headline-md text-white mb-6">Ready to transform your property?</h2>
              <p className="font-body text-body-lg mb-8 max-w-md text-white/80">Book a consultation to discuss how our design studio can elevate your asset's nightly rate and occupancy.</p>
              <Link to="/contact?inquiry=design" className="inline-block bg-white text-primary px-8 py-4 font-body text-label-caps tracking-widest uppercase hover:bg-surface-dim transition-colors">
                Enquire Now
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
