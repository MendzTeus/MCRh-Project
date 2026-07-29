import { MapPin } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import ContactForm from '../components/ContactForm';
import { useSiteContent, text } from '../hooks/useSiteContent';

export default function Contact() {
  const site = useSiteContent();
  const email = text(site.content, 'contact.email', 'hello@mcrh.co.uk');
  const phone = text(site.content, 'contact.phone', '');
  const address = text(site.content, 'contact.address', 'Chambers Building\nDeansgate\nManchester, M3 3EW\nUnited Kingdom');

  return (
    <div className="animate-in fade-in duration-500 bg-inverse-surface min-h-screen pt-20">
      <Helmet>
        <title>{text(site.content, 'seo.contact.title', 'Contact | MCRh Manchester')}</title>
        <meta name="description" content={text(site.content, 'seo.contact.description', "Get in touch with MCRh — Manchester's premium short-let apartment specialists. Enquire about stays, management or design services.")} />
      </Helmet>
      <div className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-16 md:py-32 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-32">
        <div className="text-inverse-on-surface">
          <h1 className="font-display text-display-lg-mobile md:text-display-lg mb-8 text-white">Begin the conversation.</h1>
          <p className="font-body text-body-lg text-white/70 mb-16 max-w-md">
            {text(site.content, 'contact.intro', 'Whether you are looking to book an extended stay or discuss the management of your property, our team is at your disposal.')}
          </p>

          <div className="space-y-12">
            <div>
              <span className="font-body text-label-caps text-white/50 mb-2 block">General Enquiries</span>
              <a href={`mailto:${email}`} className="font-body text-2xl hover:text-secondary-container transition-colors text-white">
                {email}
              </a>
              {phone && (
                <a href={`tel:${phone.replace(/\s+/g, '')}`} className="font-body text-lg hover:text-secondary-container transition-colors text-white/80 block mt-3">
                  {phone}
                </a>
              )}
            </div>

            <div className="pt-8 border-t border-white/10">
              <span className="font-body text-label-caps text-white/50 mb-4 block">The Studio</span>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-white/50 mt-1 shrink-0" />
                <address className="font-body not-italic text-white/80 leading-relaxed whitespace-pre-line">
                  {address}
                </address>
              </div>
            </div>
          </div>
        </div>

        <ContactForm />
      </div>
    </div>
  );
}
