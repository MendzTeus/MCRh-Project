import { useState, type FormEvent } from 'react';
import { AlertCircle, ArrowRight, CheckCircle } from 'lucide-react';

type FormStatus = 'idle' | 'sending' | 'sent' | 'error';

const labelClass = 'font-body text-label-caps font-semibold text-on-surface-variant';
const inputClass = 'w-full bg-transparent border-b border-outline-variant/50 py-2 focus:outline-none focus:border-primary transition-colors font-body';

export default function ContactForm() {
  const [status, setStatus] = useState<FormStatus>('idle');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');

    try {
      const form = e.currentTarget;
      const fd = new FormData(form);
      const firstName = (fd.get('firstName') as string || '').trim();
      const lastName = (fd.get('lastName') as string || '').trim();
      const inquiryType = (fd.get('inquiryType') as string || '').trim();
      const body = {
        name: [firstName, lastName].filter(Boolean).join(' ') || 'Unknown',
        email: fd.get('email') as string,
        message: fd.get('message') as string | undefined,
        propertyName: inquiryType || 'General',
        source: 'contact-form',
      };
      const response = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
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
    <div className="bg-white p-8 md:p-12 rounded-xl text-on-surface">
      <h2 className="font-display text-headline-sm text-primary mb-8">Send an Enquiry</h2>

      {status === 'sent' ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
          <CheckCircle className="w-12 h-12 text-secondary" />
          <h3 className="font-display text-headline-sm text-primary">Message sent</h3>
          <p className="font-body text-on-surface-variant max-w-xs">Thank you — we'll be in touch within 24 hours.</p>
          <button
            type="button"
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
            <label htmlFor="inquiryType" className={labelClass}>Enquiry Type</label>
            <select id="inquiryType" name="inquiryType" className={`${inputClass} text-on-surface`}>
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
              className={`${inputClass} resize-none`}
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
            {status === 'sending' ? 'Sending…' : <><span>Submit Enquiry</span><ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>
      )}
    </div>
  );
}
