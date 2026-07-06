import { useState, type FormEvent } from 'react';
import { MapPin, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { useSiteContent, text } from '../hooks/useSiteContent';

type FormStatus = 'idle' | 'sending' | 'sent' | 'error';

const labelClass = 'font-body text-label-caps font-semibold text-on-surface-variant';
const inputClass = 'w-full bg-transparent border-b border-outline-variant/50 py-2 focus:outline-none focus:border-primary transition-colors font-body';

export default function Contact() {
  const [status, setStatus] = useState<FormStatus>('idle');
  const site = useSiteContent();
  const email = text(site.content, 'contact.email', 'hello@mcrh.co.uk');
  const phone = text(site.content, 'contact.phone', '');
  const address = text(site.content, 'contact.address', 'Chambers Building\nDeansgate\nManchester, M3 3EW\nUnited Kingdom');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    try {
      const form = e.currentTarget;
      const data = new FormData(form);
      const res = await fetch('https://formspree.io/f/xkgjeqvb', {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        setStatus('sent');
        form.reset();
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="animate-in fade-in duration-500 bg-inverse-surface min-h-screen pt-20">
      <div className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-16 md:py-32 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-32">
        <div className="text-inverse-on-surface">
          <h1 className="font-display text-display-lg-mobile md:text-display-lg mb-8 text-white">Begin the conversation.</h1>
          <p className="font-body text-body-lg text-white/70 mb-16 max-w-md">
            {text(site.content, 'contact.intro', 'Whether you are looking to book an extended stay or discuss the management of your property, our team is at your disposal.')}
          </p>

          <div className="space-y-12">
            <div>
              <span className="font-body text-label-caps text-white/50 mb-2 block">General Inquiries</span>
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

        <div className="bg-white p-8 md:p-12 rounded-xl text-on-surface">
          <h2 className="font-display text-headline-sm text-primary mb-8">Send an Inquiry</h2>

          {status === 'sent' ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
              <CheckCircle className="w-12 h-12 text-secondary" />
              <h3 className="font-display text-headline-sm text-primary">Message sent</h3>
              <p className="font-body text-on-surface-variant max-w-xs">Thank you — we'll be in touch within 24 hours.</p>
              <button
                onClick={() => setStatus('idle')}
                className="mt-4 font-body text-label-caps text-primary underline underline-offset-4 hover:text-secondary transition-colors uppercase tracking-widest"
              >
                Send another
              </button>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit} aria-busy={status === 'sending'}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="firstName" className={labelClass}>First Name</label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    className={inputClass}
                    placeholder="Jonathan"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="lastName" className={labelClass}>Last Name</label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    className={inputClass}
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className={labelClass}>Email Address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className={inputClass}
                  placeholder="jonathan@example.com"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="inquiryType" className={labelClass}>Inquiry Type</label>
                <select id="inquiryType" name="inquiryType" className={inputClass + ' text-on-surface'}>
                  <option value="booking">Guest Booking</option>
                  <option value="management">Property Management</option>
                  <option value="design">Design Studio</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className={labelClass}>Message</label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  required
                  className={inputClass + ' resize-none'}
                  placeholder="How can we assist you?"
                />
              </div>

              {status === 'error' && (
                <div className="flex items-center gap-2 text-red-600 font-body text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Something went wrong. Please try again or email us directly.
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full bg-primary text-white py-4 font-body text-label-caps tracking-widest uppercase hover:bg-inverse-surface transition-colors flex items-center justify-center gap-2 mt-8 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status === 'sending' ? 'Sending…' : <><span>Submit Inquiry</span><ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
