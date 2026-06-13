import { MapPin, Mail, ArrowRight } from 'lucide-react';

export default function Contact() {
  return (
    <div className="animate-in fade-in duration-500 bg-inverse-surface min-h-screen pt-20">
      <div className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-16 md:py-32 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-32">
        <div className="text-inverse-on-surface">
          <h1 className="font-display text-display-lg-mobile md:text-display-lg mb-8 text-white">Begin the conversation.</h1>
          <p className="font-body text-body-lg text-white/70 mb-16 max-w-md">
            Whether you are looking to book an extended stay or discuss the management of your property, our team is at your disposal.
          </p>
          
          <div className="space-y-12">
            <div>
              <span className="font-body text-[10px] uppercase tracking-widest text-white/50 mb-2 block">General Inquiries</span>
              <a href="mailto:contact@mcrh.co.uk" className="font-body text-2xl hover:text-secondary-container transition-colors">
                contact@mcrh.co.uk
              </a>
            </div>
            
            <div className="pt-8 border-t border-white/10">
              <span className="font-body text-[10px] uppercase tracking-widest text-white/50 mb-4 block">The Studio</span>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-white/50 mt-1" />
                <address className="font-body not-italic text-white/80 leading-relaxed">
                  Chambers Building<br />
                  Deansgate<br />
                  Manchester, M3 3EW<br />
                  United Kingdom
                </address>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 md:p-12 rounded-xl text-on-surface">
          <h3 className="font-display text-headline-sm text-primary mb-8">Send an Inquiry</h3>
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="font-body text-[10px] uppercase tracking-widest font-semibold text-on-surface-variant">First Name</label>
                <input 
                  type="text" 
                  className="w-full bg-transparent border-b border-outline-variant/50 py-2 focus:outline-none focus:border-primary transition-colors font-body"
                  placeholder="Jonathan"
                />
              </div>
              <div className="space-y-2">
                <label className="font-body text-[10px] uppercase tracking-widest font-semibold text-on-surface-variant">Last Name</label>
                <input 
                  type="text" 
                  className="w-full bg-transparent border-b border-outline-variant/50 py-2 focus:outline-none focus:border-primary transition-colors font-body"
                  placeholder="Doe"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="font-body text-[10px] uppercase tracking-widest font-semibold text-on-surface-variant">Email Address</label>
              <input 
                type="email" 
                className="w-full bg-transparent border-b border-outline-variant/50 py-2 focus:outline-none focus:border-primary transition-colors font-body"
                placeholder="jonathan@example.com"
              />
            </div>

            <div className="space-y-2">
              <label className="font-body text-[10px] uppercase tracking-widest font-semibold text-on-surface-variant">Inquiry Type</label>
              <select className="w-full bg-transparent border-b border-outline-variant/50 py-2 focus:outline-none focus:border-primary transition-colors font-body text-on-surface">
                <option value="booking">Guest Booking</option>
                <option value="management">Property Management</option>
                <option value="design">Design Studio</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="font-body text-[10px] uppercase tracking-widest font-semibold text-on-surface-variant">Message</label>
              <textarea 
                rows={4}
                className="w-full bg-transparent border-b border-outline-variant/50 py-2 focus:outline-none focus:border-primary transition-colors font-body resize-none"
                placeholder="How can we assist you?"
              ></textarea>
            </div>

            <button className="w-full bg-primary text-white py-4 font-body text-label-caps tracking-widest uppercase hover:bg-inverse-surface transition-colors flex items-center justify-center gap-2 mt-8">
              Submit Inquiry <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
