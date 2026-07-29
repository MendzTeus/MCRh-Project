import { Key, MessageCircle, ShieldCheck, Sparkles, TrendingUp, Wrench } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import MediaImage from '../components/MediaImage';
import { useSiteContent, text, list } from '../hooks/useSiteContent';

export default function ManagementServices() {
  const site = useSiteContent();
  const services = list<{title:string;desc:string}>(site.content, 'management.services.cards', [
    {
      title: 'Property Maintenance',
      desc: 'We take care of any small maintenance issues and remain on call throughout your guest’s stay.',
    },
    {
      title: 'Professional Housekeeping',
      desc: 'Cleaning is the backbone of our business and the foundation of a positive guest experience.',
    },
    {
      title: 'Guest Communication',
      desc: 'We pride ourselves on providing five-star customer service and remain available to answer all guest enquiries.',
    },
    {
      title: 'Listing Optimisation',
      desc: 'We manage your property’s online presence, optimise pricing and help maximise occupancy and profitability.',
    },
    {
      title: 'Guest Approval',
      desc: 'All guest profiles are thoroughly reviewed before acceptance, helping ensure that only reliable guests stay in your property.',
    },
    {
      title: 'Guest Check-In',
      desc: 'We provide every guest with clear arrival instructions and a warm, smooth welcome to their Manchester accommodation.',
    },
  ]);
  const serviceIcons = [Wrench, Sparkles, MessageCircle, TrendingUp, ShieldCheck, Key];

  return (
    <div className="animate-in fade-in duration-500">
      <Helmet>
        <title>{text(site.content, 'seo.management.title', 'Management Services | MCRh Property Management Manchester')}</title>
        <meta name="description" content={text(site.content, 'seo.management.description', 'Full-cycle short-term rental management in Manchester. Guest screening, 24/7 concierge, dynamic pricing, housekeeping and transparent reporting for property owners.')} />
        <meta property="og:title" content={text(site.content, 'seo.management.ogTitle', 'MCRh Property Management | Manchester Short-Let Experts')} />
      </Helmet>

      <section className="relative w-full h-[60vh] min-h-[500px] flex items-center justify-center bg-surface border-b border-outline-variant/30">
        <div className="absolute inset-0 z-0">
          {site.images['management.hero']
            ? <img src={site.images['management.hero'].url} alt={site.images['management.hero'].alt || 'MCRh managed property'} className="h-full w-full object-cover" />
            : <MediaImage propertySlug="chambers" index={4} alt="MCRh managed property — Chambers Residence Manchester" className="h-full w-full object-cover" />}
          <div className="absolute inset-0 bg-surface/70"></div>
        </div>
        <div className="relative z-10 text-center max-w-3xl px-6">
          <span className="font-body text-label-caps text-secondary block mb-6 tracking-widest uppercase">{text(site.content, 'management.hero.eyebrow', 'Complete Operations')}</span>
          <h1 className="font-display text-display-lg-mobile md:text-display-lg text-primary mb-6">{text(site.content, 'management.hero.title', 'Effortless Yield Management')}</h1>
          <p className="font-body text-body-lg text-on-surface-variant max-w-2xl mx-auto">
            {text(site.content, 'management.hero.paragraph', 'We handle every operational detail, from dynamic pricing algorithms to white-glove guest service, maximizing your return while liberating your time.')}
          </p>
        </div>
      </section>

      <section className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-section-gap">
        <div className="text-center mb-16">
          <span className="font-body text-label-caps text-secondary mb-4 block tracking-widest uppercase">{text(site.content, 'management.services.eyebrow', 'Service Architecture')}</span>
          <h2 className="font-display text-headline-md text-primary max-w-2xl mx-auto">{text(site.content, 'management.services.title', 'Full-Cycle Property Management')}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
          {services.map((service, i) => {
            const Icon = serviceIcons[i % serviceIcons.length];
            return (
              <div key={`${service.title}-${i}`} className="flex gap-6">
                <div className="w-12 h-12 bg-surface-container rounded-full flex items-center justify-center shrink-0">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-headline-sm text-primary mb-3">{service.title}</h3>
                  <p className="font-body text-on-surface-variant leading-relaxed">{service.desc as string}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
