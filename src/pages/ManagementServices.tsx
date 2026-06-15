import { Key, User, ArrowRight, ShieldCheck, Check, Crosshair } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import MediaImage from '../components/MediaImage';

export default function ManagementServices() {
  return (
    <div className="animate-in fade-in duration-500">
      <Helmet>
        <title>Management Services | MCRh Property Management Manchester</title>
        <meta name="description" content="Full-cycle short-term rental management in Manchester. Guest screening, 24/7 concierge, dynamic pricing, housekeeping and transparent reporting for property owners." />
        <meta property="og:title" content="MCRh Property Management | Manchester Short-Let Experts" />
      </Helmet>

      <section className="relative w-full h-[60vh] min-h-[500px] flex items-center justify-center bg-surface border-b border-outline-variant/30">
        <div className="absolute inset-0 z-0">
          <MediaImage propertySlug="chambers" index={4} alt="MCRh managed property — Chambers Residence Manchester" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-surface/70"></div>
        </div>
        <div className="relative z-10 text-center max-w-3xl px-6">
          <span className="font-body text-label-caps text-secondary block mb-6 tracking-widest uppercase">Complete Operations</span>
          <h1 className="font-display text-display-lg-mobile md:text-display-lg text-primary mb-6">Effortless Yield Management</h1>
          <p className="font-body text-body-lg text-on-surface-variant max-w-2xl mx-auto">
            We handle every operational detail, from dynamic pricing algorithms to white-glove guest service, maximizing your return while liberating your time.
          </p>
        </div>
      </section>

      <section className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-section-gap">
        <div className="text-center mb-16">
          <span className="font-body text-label-caps text-secondary mb-4 block tracking-widest uppercase">Service Architecture</span>
          <h2 className="font-display text-headline-md text-primary max-w-2xl mx-auto">Full-Cycle Property Management</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
          {[
            {
              icon: Key,
              title: "Guest Screening & Check-in",
              desc: "Rigorous vetting processes ensure only responsible guests enter your property. We manage secure, seamless access systems for 24/7 arrivals."
            },
            {
              icon: User,
              title: "24/7 Guest Concierge",
              desc: "Round-the-clock support for any guest inquiries or emergencies, ensuring five-star reviews and complete peace of mind for owners."
            },
            {
              icon: ShieldCheck,
              title: "Maintenance & Housekeeping",
              desc: "Hotel-standard cleaning between every stay. Preventive maintenance checks and immediate response to any property issues to preserve asset value."
            },
            {
              icon: Crosshair,
              title: "Revenue Optimization",
              desc: "Dynamic, algorithm-driven pricing adjusted daily based on market demand, local events, and historical data to maximize occupancy and yield."
            }
          ].map((service, i) => (
            <div key={i} className="flex gap-6">
              <div className="w-12 h-12 bg-surface-container rounded-full flex items-center justify-center shrink-0">
                <service.icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-headline-sm text-primary mb-3">{service.title}</h3>
                <p className="font-body text-on-surface-variant leading-relaxed">{service.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-surface-dim py-section-gap border-y border-outline-variant/30">
        <div className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="font-display text-headline-md text-primary mb-6">Transparent Reporting</h2>
            <p className="font-body text-on-surface-variant mb-8 text-lg">
              Through our owner portal, you maintain complete visibility over your property's performance, without the operational headaches.
            </p>
            <ul className="space-y-4 font-body text-on-surface">
              {['Real-time occupancy calendar', 'Monthly financial statements', 'Maintenance logs and receipts', 'Guest review summaries'].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-secondary shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-surface p-8 rounded-xl border border-outline-variant/30 shadow-lg relative overflow-hidden">
             <div className="absolute right-0 top-0 w-32 h-32 bg-secondary opacity-5 rounded-bl-full"></div>
             <h3 className="font-display text-headline-sm text-primary mb-6">Partner Criteria</h3>
             <p className="font-body text-sm text-on-surface-variant mb-6 pb-6 border-b border-outline-variant/30">To maintain our service standards, we selectively partner with properties that meet our brand criteria:</p>
             <ul className="space-y-4 font-body text-sm text-on-surface">
               <li className="flex items-start gap-2"><ArrowRight className="w-4 h-4 mt-0.5 text-primary" /> Prime city-centre locations</li>
               <li className="flex items-start gap-2"><ArrowRight className="w-4 h-4 mt-0.5 text-primary" /> High-spec finishes and layout</li>
               <li className="flex items-start gap-2"><ArrowRight className="w-4 h-4 mt-0.5 text-primary" /> Commitment to quality maintenance</li>
             </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
