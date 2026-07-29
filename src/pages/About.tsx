import { Check } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import ContactForm from '../components/ContactForm';
import MediaImage from '../components/MediaImage';
import { list, useSiteContent, text } from '../hooks/useSiteContent';

export default function About() {
  const site = useSiteContent();
  return (
    <div className="animate-in fade-in duration-500">
      <Helmet>
        <title>{text(site.content, 'seo.about.title', 'About | MCRh Manchester Short-Let Apartments')}</title>
        <meta name="description" content={text(site.content, 'seo.about.description', 'MCRh was founded to bridge the gap between boutique hotels and short-term rentals. We manage a curated portfolio of design-led properties in Manchester.')} />
        <meta property="og:title" content={text(site.content, 'seo.about.ogTitle', 'About MCRh | Manchester Luxury Lettings')} />
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
          <h2 className="font-display text-headline-md text-primary sticky top-32">{text(site.content, 'about.philosophy.title', 'Who We Are')}</h2>
        </div>
        <div className="md:col-span-8 font-body text-body-lg text-on-surface-variant space-y-8 mt-8 md:mt-0">
          <p className="text-2xl text-primary font-display leading-relaxed">
            {text(site.content, 'about.philosophy.p1', 'We love what we do, and it shows — just look at our portfolio and reviews. With years of experience in the industry through Airbnb, our mission is to help landlords turn their investments into a profitable source of income, acting as the middleman and bringing a personal touch to the short-let market.')}
          </p>
          <p>
            {text(site.content, 'about.philosophy.p2', 'Whether guests are staying for a short break or a long business engagement, or choose to make one of our fully furnished and managed properties their home in the city, we always aim to deliver memorable stays.')}
          </p>
          <p>
            {text(site.content, 'about.philosophy.p3', 'Manchester has so much to offer — the city is booming, and more and more travellers and business visitors are coming to the city regularly. At MCRh, we know the city inside and out, so let us take care of your guests.')}
          </p>
        </div>
      </section>

      <section className="bg-surface-container py-section-gap border-y border-outline-variant/30">
        <div className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="font-body text-body-lg text-on-surface-variant space-y-6">
            <span className="font-body text-label-caps text-secondary block tracking-widest uppercase">Guest Stays</span>
            <h2 className="font-display text-headline-md text-primary">
              {text(site.content, 'about.stays.title', 'Exquisite short-stay apartments')}
            </h2>
            <p>
              {text(site.content, 'about.stays.p1', 'We offer a wide selection of premier short-stay apartments located throughout central Manchester and the city centre.')}
            </p>
            <p>
              {text(site.content, 'about.stays.p2', 'Whether you are coming to enjoy the vibrant city nightlife, immerse yourself in the heritage of our museums, galleries and architecture, watch a world-class football match, or fly in for business, we have the perfect place for you to stay.')}
            </p>
            <p className="text-primary font-medium">
              {text(site.content, 'about.stays.p3', 'Take a tour of our first-class apartments to find the right one for you.')}
            </p>
          </div>
          <div className="h-[360px] md:h-[520px] overflow-hidden rounded-sm">
            <MediaImage propertySlug="chambers" index={1} alt="MCRh short-stay apartment in central Manchester" className="w-full h-full object-cover" />
          </div>
        </div>
      </section>

      <section className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-section-gap grid grid-cols-1 md:grid-cols-12 gap-gutter">
        <div className="md:col-span-5">
          <span className="font-body text-label-caps text-secondary block mb-5 tracking-widest uppercase">Property Owners</span>
          <h2 className="font-display text-headline-md text-primary">
            {text(site.content, 'about.management.title', 'Experts in property management')}
          </h2>
        </div>
        <div className="md:col-span-7 font-body text-body-lg text-on-surface-variant space-y-8">
          <p>
            {text(site.content, 'about.management.intro', 'Based in the heart of Manchester, we provide comprehensive short-let property management services to clients across the city.')}
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-base text-on-surface">
            {list<{item:string}>(site.content, 'about.management.services', [
              { item: 'Interior and exterior design and refurbishment' },
              { item: 'General property maintenance' },
              { item: 'Property listing optimisation' },
              { item: 'Guest communications management' },
              { item: 'Professional housekeeping services' },
              { item: 'Guest approval' },
              { item: 'Guest check-in and check-out' },
            ]).map((service, index) => (
              <li key={`${service.item}-${index}`} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                <span>{service.item}</span>
              </li>
            ))}
          </ul>
          <p>
            {text(site.content, 'about.management.closing', 'From our consultative approach to property management to our personalised guest experience service, we make sure our property management services exceed all expectations.')}
          </p>
        </div>
      </section>

      <section className="bg-inverse-surface py-section-gap">
        <div className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-start">
          <div className="text-white lg:pt-8">
            <span className="font-body text-label-caps text-secondary-container block mb-6 tracking-widest uppercase">Contact Us</span>
            <h2 className="font-display text-display-lg-mobile md:text-headline-lg mb-6">Let’s begin the conversation.</h2>
            <p className="font-body text-body-lg text-white/70 max-w-lg">
              Whether you are looking for a memorable Manchester stay or expert management for your property, our team would be delighted to hear from you.
            </p>
          </div>
          <ContactForm />
        </div>
      </section>
    </div>
  );
}
