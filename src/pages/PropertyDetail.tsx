import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Star, ChevronDown, BedDouble, Wifi, ChefHat, Coffee, Snowflake, Bath, ArrowRight, ArrowLeft, X, MessageCircle, Mail } from 'lucide-react';
import Lightbox from '../components/Lightbox';
import { getReviewsForProperty } from '../data/reviews';
import { getPropertyMapEmbedUrl } from '../data/locations';
import DateRangePicker, { formatShortDate } from '../components/DateRangePicker';
import MediaImage from '../components/MediaImage';
import { getInventoryUnit } from '../data/airbnbInventory';
import { getListingMedia, getUnitGallery, getUnitSpecs } from '../data/listingMedia';
import { getPropertyBySlug, getUnitBySlug, type PropertyUnit } from '../data/properties';
import { useClickOutside } from '../hooks/useClickOutside';
import { useUnitBlockedDates } from '../hooks/useUnitBlockedDates';
import { useSiteContent, text } from '../hooks/useSiteContent';

export default function PropertyDetail() {
  const { propertySlug, id } = useParams();
  const routedProperty = getPropertyBySlug(propertySlug);
  const routedUnit = routedProperty?.units.find((item) => item.slug === id);
  const legacyUnit = getUnitBySlug(id);
  const property = routedProperty || legacyUnit?.property || getPropertyBySlug('chambers');
  const inventoryUnit = getInventoryUnit(propertySlug, id);
  const listingMedia = getListingMedia(inventoryUnit?.unitSlug || id);
  const inventoryBackedUnit: PropertyUnit | undefined = inventoryUnit
    ? {
        slug: inventoryUnit.unitSlug,
        title: listingMedia?.title || inventoryUnit.unitName,
        label: inventoryUnit.unitName,
        specs: inventoryUnit.suppliedSpecs || 'Specs to confirm',
        description: `${inventoryUnit.propertyName}, ${inventoryUnit.postcode}.`,
      }
    : undefined;
  const unit = routedUnit || legacyUnit?.unit || inventoryBackedUnit || property?.units[0];
  const unitGallery = getUnitGallery(unit?.slug, property?.slug);
  // Reserved dates (from the synced iCal) for this unit, to grey out the calendar.
  const blockedDates = useUnitBlockedDates(inventoryUnit?.unitSlug || id);
  // Booking links. VRBO uses the per-unit listing URL (not the iCal feed), so the
  // option only appears once a real VRBO listing link is configured.
  const airbnbUrl = inventoryUnit?.airbnbUrl || listingMedia?.finalUrl;
  const vrboUrl = inventoryUnit?.vrboUrl;
  // Central company contact (editable in SiteContent). WhatsApp is optional — its
  // option only shows once a number is configured; e-mail always works.
  const site = useSiteContent();
  const whatsappNumber = text(site.content, 'contact.whatsapp', '').replace(/\D/g, '');
  const contactEmail = text(site.content, 'contact.email', 'hello@mcrh.co.uk');
  const displayRating = listingMedia?.rating || '4.98';
  const reviews = getReviewsForProperty(property?.slug || 'chambers');
  const reviewsRef = useRef<HTMLDivElement>(null);
  const guestsDropdownRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);
  const [contactOpen, setContactOpen] = useState(false);
  useClickOutside(contactRef, () => setContactOpen(false), contactOpen);
  const [amenitiesOpen, setAmenitiesOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [datesOpen, setDatesOpen] = useState(false);

  useEffect(() => {
    // The gallery lightbox handles its own keyboard nav; this only closes the
    // amenities modal on Escape.
    if (!amenitiesOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setAmenitiesOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [amenitiesOpen]);
  const [guestsOpen, setGuestsOpen] = useState(false);
  useClickOutside(guestsDropdownRef, () => setGuestsOpen(false), guestsOpen);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);

  if (!property || !unit) return null;

  // Pre-filled enquiry message for the "Contact us directly" options.
  const hasDates = Boolean(checkIn && checkOut);
  const fmtDate = (d: string) => (d ? new Date(`${d}T00:00`).toLocaleDateString('pt-BR') : '');
  const enquiryText = hasDates
    ? `Olá! Gostaria de reservar o apartamento ${unit.title} de ${fmtDate(checkIn)} a ${fmtDate(checkOut)} para ${guests} ${guests === 1 ? 'hóspede' : 'hóspedes'}.`
    : `Olá! Gostaria de saber mais sobre o apartamento ${unit.title}.`;
  const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(enquiryText)}`;
  const emailHref = `mailto:${contactEmail}?subject=${encodeURIComponent(`Reserva - ${unit.title}`)}&body=${encodeURIComponent(enquiryText)}`;

  // Per-unit specs from the Airbnb scrape, falling back to the property's own
  // figures when a listing didn't scrape (e.g. Crusader's intermittently blocked page).
  const scrapedSpecs = getUnitSpecs(inventoryUnit?.unitSlug || id);
  const specGuests = scrapedSpecs?.guests ?? property.maxGuests;
  const specBedrooms = scrapedSpecs?.bedrooms ?? property.bedrooms;
  const specBeds = scrapedSpecs?.beds ?? property.beds;
  const specBaths = scrapedSpecs?.baths ?? property.bathrooms;
  const reviewsCount = scrapedSpecs?.reviewsCount ?? null;
  const plural = (n: number, word: string) => `${n} ${n === 1 ? word : `${word}s`}`;
  const specsLine = [
    plural(specGuests, 'guest'),
    specBedrooms != null && plural(specBedrooms, 'bedroom'),
    specBeds != null && plural(specBeds, 'bed'),
    specBaths != null && plural(specBaths, 'bathroom'),
  ].filter(Boolean).join(' · ');

  return (
    <div className="animate-in fade-in duration-500">
      <Helmet>
        <title>{unit.title} — {property.name} | MCRh Manchester</title>
        <meta name="description" content={`${unit.description} ${unit.specs}. Located in ${property.area}, Manchester.`} />
        <meta property="og:title" content={`${unit.title} | MCRh Manchester`} />
        <meta property="og:description" content={unit.description} />
        {unitGallery[0] && <meta property="og:image" content={unitGallery[0]} />}
      </Helmet>

      <section className="relative w-full min-h-[600px] md:h-[921px] flex items-end pb-section-gap">
        <div className="absolute inset-0 z-0 bg-surface-dim">
          <MediaImage src={unitGallery[0]} propertySlug={property.slug} alt={unit.title} loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        </div>

        <div className="relative z-10 w-full max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row justify-between items-end gap-gutter pb-12 md:pb-0">
          <div className="text-white w-full md:w-2/3">
            <p className="font-body text-label-caps tracking-widest mb-4 opacity-80 uppercase">{unit.label}</p>
            <h1 className="font-display text-display-lg-mobile md:text-display-lg mb-6 leading-tight">{unit.title}</h1>
            <p className="font-body text-body-lg opacity-90 max-w-2xl">{unit.description}</p>
            <p className="font-body text-label-caps tracking-widest uppercase text-sm text-white/80 mt-5">{specsLine}</p>
          </div>

          <div className="relative w-full md:w-1/3 bg-surface p-8 rounded-xl shadow-2xl md:translate-y-1/4 backdrop-blur-md bg-opacity-95 border border-outline-variant/20">
            <div className="flex justify-end items-center mb-6 border-b border-outline-variant/30 pb-4">
              <div className="flex items-center gap-1.5 text-on-surface-variant">
                <Star className="w-4 h-4 fill-current text-secondary" />
                <span className="font-body text-body-md font-semibold">{displayRating}</span>
                {reviewsCount != null && (
                  <span className="font-body text-sm text-on-surface-variant/70">· {plural(reviewsCount, 'review')}</span>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-px bg-outline-variant/30 border border-outline-variant/30 rounded-lg mb-6 overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  setDatesOpen((open) => !open);
                  setGuestsOpen(false);
                }}
                className="bg-surface p-3 cursor-pointer hover:bg-surface-container transition-colors text-left"
              >
                <div className="font-body text-[10px] font-semibold text-on-surface-variant mb-1 uppercase">Check-in</div>
                <div className="font-body text-body-md text-primary">{formatShortDate(checkIn)}</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setDatesOpen((open) => !open);
                  setGuestsOpen(false);
                }}
                className="bg-surface p-3 cursor-pointer hover:bg-surface-container transition-colors text-left"
              >
                <div className="font-body text-[10px] font-semibold text-on-surface-variant mb-1 uppercase">Check-out</div>
                <div className="font-body text-body-md text-primary">{formatShortDate(checkOut)}</div>
              </button>
              <div ref={guestsDropdownRef} className="col-span-2 relative">
              <button
                type="button"
                onClick={() => {
                  setGuestsOpen((open) => !open);
                  setDatesOpen(false);
                }}
                className="bg-surface p-3 w-full cursor-pointer hover:bg-surface-container transition-colors flex justify-between items-center text-left"
              >
                <div>
                  <div className="font-body text-[10px] font-semibold text-on-surface-variant mb-1 uppercase">Guests</div>
                  <div className="font-body text-body-md text-primary">{guests} {guests === 1 ? 'guest' : 'guests'}</div>
                </div>
                <ChevronDown className="w-5 h-5 text-on-surface-variant" />
              </button>
            {guestsOpen && (
              <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-xl border border-outline-variant/30 bg-surface p-5 shadow-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-body text-body-md font-semibold text-primary">Guests</div>
                    <div className="font-body text-sm text-on-surface-variant">Adults and children</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setGuests((value) => Math.max(1, value - 1))}
                      className="h-10 w-10 rounded-full border border-outline-variant/50 text-primary"
                    >
                      -
                    </button>
                    <span className="min-w-6 text-center font-body text-body-md">{guests}</span>
                    <button
                      type="button"
                    onClick={() => setGuests((value) => Math.min(property.maxGuests, value + 1))}
                      className="h-10 w-10 rounded-full border border-outline-variant/50 text-primary"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            )}
              </div>
            </div>

            {datesOpen && (
              <DateRangePicker
                checkIn={checkIn}
                checkOut={checkOut}
                blockedDates={blockedDates}
                onChange={({ checkIn: nextCheckIn, checkOut: nextCheckOut }) => {
                  setCheckIn(nextCheckIn);
                  setCheckOut(nextCheckOut);
                }}
                onDone={() => setDatesOpen(false)}
              />
            )}

            <div className="space-y-3">
              {/* 1. Airbnb — primary, always shown */}
              <div>
                <button
                  type="button"
                  onClick={() => { if (airbnbUrl) window.open(airbnbUrl, '_blank', 'noopener,noreferrer'); }}
                  className="w-full py-4 bg-primary text-on-primary font-body text-label-caps tracking-widest hover:opacity-90 transition-opacity uppercase rounded"
                >
                  Book on Airbnb
                </button>
              </div>

              {/* 2. VRBO — secondary outline, only when a VRBO link exists */}
              {vrboUrl && (
                <div>
                  <button
                    type="button"
                    onClick={() => window.open(vrboUrl, '_blank', 'noopener,noreferrer')}
                    className="w-full py-4 border border-primary bg-surface text-primary font-body text-label-caps tracking-widest hover:bg-surface-dim transition-colors uppercase rounded"
                  >
                    Book on VRBO
                  </button>
                </div>
              )}

              {/* 3. Contact us directly — tertiary outline + WhatsApp/E-mail menu */}
              <div className="relative" ref={contactRef}>
                <button
                  type="button"
                  onClick={() => { setContactOpen((open) => !open); setDatesOpen(false); setGuestsOpen(false); }}
                  className="w-full py-4 border border-outline-variant/50 text-on-surface-variant font-body text-label-caps tracking-widest hover:border-primary hover:text-primary transition-colors uppercase rounded flex items-center justify-center gap-2"
                >
                  Contact us directly
                  <ChevronDown className={`w-4 h-4 transition-transform ${contactOpen ? 'rotate-180' : ''}`} />
                </button>
                {contactOpen && (
                  <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-xl border border-outline-variant/30 bg-surface p-2 shadow-2xl space-y-1">
                    {whatsappNumber && (
                      <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-surface-container transition-colors"
                      >
                        <MessageCircle className="w-5 h-5 text-[#25D366]" />
                        <span className="font-body text-body-md text-primary">WhatsApp</span>
                      </a>
                    )}
                    <a
                      href={emailHref}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-surface-container transition-colors"
                    >
                      <Mail className="w-5 h-5 text-on-surface-variant" />
                      <span className="font-body text-body-md text-primary">E-mail</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-section-gap grid grid-cols-1 md:grid-cols-12 gap-gutter mt-16 md:mt-24">
        <div className="md:col-span-7 space-y-12">
          <div>
            <h2 className="font-display text-headline-md text-primary mb-6">The Space</h2>
            <div className="font-body text-on-surface-variant text-body-lg space-y-6">
              <p>{unit.description}</p>
              <p>{property.description}</p>
              <p>{unit.specs}{unit.squareFeet ? ` / ${unit.squareFeet}` : ''}</p>
            </div>
          </div>
          
          <div className="border-t border-outline-variant/30 pt-12">
            <h3 className="font-display text-headline-sm text-primary mb-8">Curated Amenities</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
              {[
                { icon: BedDouble, label: plural(specBedrooms, 'Bedroom') },
                { icon: Bath, label: plural(specBaths, 'Bathroom') },
                { icon: Wifi, label: property.amenities[0] || "Wi-Fi" },
                { icon: ChefHat, label: property.amenities[1] || "Fully equipped kitchen" },
                { icon: Coffee, label: property.amenities[2] || "Smart TV" },
                { icon: Snowflake, label: property.amenities[3] || "Climate Control" }
              ].map((amenity, i) => (
                <div key={i} className="flex items-center gap-4">
                  <amenity.icon className="w-8 h-8 text-on-surface-variant font-light" strokeWidth={1} />
                  <span className="font-body text-body-lg text-on-surface">{amenity.label}</span>
                </div>
              ))}
            </div>
            
            <button
              onClick={() => setAmenitiesOpen(true)}
              className="mt-10 px-6 py-3 border border-outline-variant text-on-surface font-body text-label-caps tracking-widest hover:border-primary transition-colors duration-300 uppercase"
            >
              Show All Amenities
            </button>
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      {unitGallery.length > 0 && (
        <section className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-section-gap">
          <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-2 gap-2 md:gap-3" style={{ height: 480 }}>
            {/* Main large image — spans 2 cols + 2 rows */}
            <div className="col-span-2 row-span-2 rounded-xl overflow-hidden cursor-pointer" onClick={() => { setGalleryIndex(0); setGalleryOpen(true); }}>
              <img src={unitGallery[0]} alt={`${unit.title} main`} className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500" />
            </div>
            {/* 4 thumbnails — right side, each 1 col × 1 row */}
            {[1, 2, 3, 4].map((i) => (
              unitGallery[i] ? (
                <div key={i} className={`overflow-hidden cursor-pointer ${i === 2 ? 'rounded-tr-xl' : ''} ${i === 4 ? 'rounded-br-xl' : ''}`}
                  onClick={() => { setGalleryIndex(i); setGalleryOpen(true); }}>
                  <img src={unitGallery[i]} alt={`${unit.title} photo ${i + 1}`} className="w-full h-full object-cover hover:scale-[1.04] transition-transform duration-500" />
                </div>
              ) : <div key={i} className="bg-surface-dim rounded" />
            ))}
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={() => { setGalleryIndex(0); setGalleryOpen(true); }}
              className="flex items-center gap-2 text-primary font-body text-label-caps tracking-widest hover:opacity-70 transition-opacity uppercase border border-outline-variant/50 px-4 py-2 rounded-lg text-xs"
            >
              View All {unitGallery.length} Photos <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </section>
      )}
      
      {/* Reviews Slider */}
      <section className="bg-surface-container-low py-section-gap">
        <div className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="font-display text-headline-md text-primary mb-2">Guest Reflections</h2>
              <div className="flex items-center gap-2 text-on-surface-variant">
                <Star className="w-4 h-4 fill-current text-secondary" />
                <span className="font-body text-body-lg">{displayRating} · Airbnb reviews</span>
              </div>
            </div>
            <div className="hidden md:flex gap-4">
              <button
                aria-label="Previous review"
                onClick={() => reviewsRef.current?.scrollBy({ left: -420, behavior: 'smooth' })}
                className="w-12 h-12 rounded-full border border-outline-variant flex items-center justify-center hover:border-primary hover:bg-surface-container transition-all"
              >
                <ArrowLeft className="w-6 h-6 text-primary" />
              </button>
              <button
                aria-label="Next review"
                onClick={() => reviewsRef.current?.scrollBy({ left: 420, behavior: 'smooth' })}
                className="w-12 h-12 rounded-full border border-outline-variant flex items-center justify-center hover:border-primary hover:bg-surface-container transition-all"
              >
                <ArrowRight className="w-6 h-6 text-primary" />
              </button>
            </div>
          </div>

          <div ref={reviewsRef} className="flex overflow-x-auto gap-8 pb-8 snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
            {reviews.map((review, i) => {
              const initials = review.name.split(' ').map((n) => n[0]).join('').slice(0, 2);
              return (
                <div key={i} className="w-[300px] md:w-[400px] shrink-0 bg-surface p-8 rounded-xl border border-outline-variant/20 snap-start">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center shrink-0">
                      <span className="font-body text-label-caps text-on-primary-container font-semibold">{initials}</span>
                    </div>
                    <div>
                      <h4 className="font-body text-body-md font-semibold text-primary">{review.name}</h4>
                      <p className="font-body text-sm text-on-surface-variant">{review.date}</p>
                    </div>
                  </div>
                  <p className="font-display text-xl text-on-surface italic opacity-90 leading-relaxed whitespace-normal break-words text-center">"{review.text}"</p>
                  {review.property && (
                    <p className="font-body text-label-caps text-on-surface-variant/60 tracking-widest uppercase mt-4">{review.property}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
      {/* Location Map */}
      <section className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-section-gap">
        <h2 className="font-display text-headline-md text-primary mb-12">The Neighborhood</h2>
        <div className="rounded-xl overflow-hidden h-[500px] relative border border-outline-variant/20">
          {getPropertyMapEmbedUrl(property.slug) ? (
            <iframe
              title={`Map of ${property.name}`}
              src={getPropertyMapEmbedUrl(property.slug)!}
              className="w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-surface-variant flex items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                  <div className="w-4 h-4 bg-primary rounded-full"></div>
                </div>
                <div className="mt-2 bg-surface px-4 py-2 rounded-lg shadow-lg border border-outline-variant/20">
                  <span className="font-body text-label-caps text-primary tracking-widest uppercase font-semibold">{unit.title}</span>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          {property.distances.slice(0, 3).map((item, i) => (
            <div key={i}>
              <h4 className="font-display text-headline-sm text-primary mb-2">{item.location}</h4>
              <p className="font-body text-body-md text-on-surface-variant">{item.time}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Amenities Modal */}
      {amenitiesOpen && (
        <div
          className="fixed inset-0 z-50 bg-primary/60 flex items-end md:items-center justify-center p-0 md:p-8"
          onClick={() => setAmenitiesOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="All amenities"
        >
          <div
            className="bg-surface w-full md:max-w-2xl max-h-[85vh] rounded-t-2xl md:rounded-2xl overflow-y-auto p-8 md:p-12"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-display text-headline-sm text-primary">What this place offers</h3>
              <button onClick={() => setAmenitiesOpen(false)} aria-label="Close amenities" className="text-on-surface-variant hover:text-primary transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
              {[
                { icon: BedDouble, label: plural(specBedrooms, 'Bedroom') },
                { icon: Bath, label: plural(specBaths, 'Bathroom') },
                ...property.amenities.map((a) => ({ icon: Snowflake, label: a })),
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 border-b border-outline-variant/20 pb-4">
                  <item.icon className="w-6 h-6 text-on-surface-variant shrink-0" strokeWidth={1.5} />
                  <span className="font-body text-body-md text-on-surface">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Gallery Lightbox */}
      {galleryOpen && unitGallery.length > 0 && (
        <Lightbox images={unitGallery} startIndex={galleryIndex} alt={unit.title} onClose={() => setGalleryOpen(false)} />
      )}
    </div>
  );
}
