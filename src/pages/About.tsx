import { Quote } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import MediaImage from '../components/MediaImage';
import { useSiteContent, text } from '../hooks/useSiteContent';

export default function About() {
  const site = useSiteContent();
  return (
    <div className="animate-in fade-in duration-500">
      <Helmet>
        <title>About | MCRh Manchester Short-Let Apartments</title>
        <meta name="description" content="MCRh was founded to bridge the gap between boutique hotels and short-term rentals. We manage a curated portfolio of design-led properties in Manchester." />
        <meta property="og:title" content="About MCRh | Manchester Luxury Lettings" />
      </Helmet>

      <section className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop pt-24 md:pt-32 pb-16">
        <span className="font-body text-label-caps text-secondary block mb-6 tracking-widest uppercase">{text(site.content, 'about.hero.eyebrow', 'Our Story')}</span>
        <h1 className="font-display text-display-lg-mobile md:text-display-lg text-primary max-w-4xl leading-tight">
          {text(site.content, 'about.hero.title', 'Redefining urban hospitality through design and discretion.')}
        </h1>
      </section>

      <section className="w-full relative h-[260px] sm:h-[380px] md:h-[600px] overflow-hidden">
        {site.images['about.hero']
          ? <img src={site.images['about.hero'].url} alt={site.images['about.hero'].alt || 'MCRh curated apartment interior'} className="h-full w-full object-cover" />
          : <MediaImage propertySlug="john-dalton-st" index={2} alt="MCRh curated apartment interior — John Dalton Street" className="h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface/30"></div>
      </section>

      <section className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-section-gap grid grid-cols-1 md:grid-cols-12 gap-gutter">
        <div className="md:col-span-4">
          <h2 className="font-display text-headline-md text-primary sticky top-32">{text(site.content, 'about.philosophy.title', 'The Philosophy')}</h2>
        </div>
        <div className="md:col-span-8 font-body text-body-lg text-on-surface-variant space-y-8 mt-8 md:mt-0">
          <p className="text-2xl text-primary font-display leading-relaxed">
            {text(site.content, 'about.philosophy.p1', 'MCRh was founded on a simple premise: the standard short-term rental market lacked the consistency of a boutique hotel and the soul of a private residence.')}
          </p>
          <p>
            {text(site.content, 'about.philosophy.p2', "We set out to bridge this gap. Operating exclusively in Manchester's prime locations, we curate and manage a tightly controlled portfolio of design-led properties. We do not aim to be the largest operator, but unequivocally the finest.")}
          </p>
          <p>
            {text(site.content, 'about.philosophy.p3', 'By integrating our own interior design studio with our operations team, we maintain absolute control over the guest experience. Every texture parsed, every lighting fixture positioned, and every guest communication sent is executed with deliberate intent.')}
          </p>
        </div>
      </section>

      <section className="bg-surface-container py-section-gap border-y border-outline-variant/30">
        <div className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="max-w-3xl mx-auto text-center relative pt-12">
            <Quote className="w-16 h-16 text-outline-variant absolute top-0 left-1/2 -translate-x-1/2 opacity-30" />
            <h3 className="font-display text-headline-sm text-primary italic leading-relaxed mb-8">
              {text(site.content, 'about.quote.text', '"We view each property not just as a yield asset, but as an architectural space that deserves to be experienced properly. True luxury is the absence of friction."')}
            </h3>
            <p className="font-body text-label-caps tracking-widest text-secondary">{text(site.content, 'about.quote.signature', '— The Founders')}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
