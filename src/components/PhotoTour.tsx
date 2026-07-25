import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowLeft } from 'lucide-react';
import Lightbox from './Lightbox';

export type TourPhoto = {
  id: string;
  src: string;
  alt: string;
  roomCategory: string;
  displayOrder: number;
};

export const ROOM_CATEGORIES = [
  'Living room',
  'Full kitchen',
  'Dining area',
  'Bedroom 1',
  'Bedroom 2',
  'Bedroom 3',
  'Full bathroom',
  'Ensuite bathroom',
  'Balcony',
  'Terrace',
  'Exterior',
  'Entrance',
  'Hallway',
  'Workspace',
  'Property',
  'Other',
] as const;

export type RoomCategory = (typeof ROOM_CATEGORIES)[number];

function groupPhotos(photos: TourPhoto[]): [string, TourPhoto[]][] {
  const order: string[] = [];
  const map = new Map<string, TourPhoto[]>();
  for (const p of [...photos].sort((a, b) => a.displayOrder - b.displayOrder)) {
    const cat = p.roomCategory || 'Property';
    if (!map.has(cat)) { map.set(cat, []); order.push(cat); }
    map.get(cat)!.push(p);
  }
  return order.map((cat) => [cat, map.get(cat)!]);
}

// ── Editorial grid ────────────────────────────────────────────────────────────
function PhotoGrid({
  photos,
  onPhotoClick,
}: {
  photos: TourPhoto[];
  onPhotoClick: (index: number) => void;
}) {
  const n = photos.length;

  const imgCls = 'w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]';
  const btnCls = 'overflow-hidden rounded-xl cursor-pointer group block';

  if (n === 1) {
    return (
      <button type="button" onClick={() => onPhotoClick(0)} className={`${btnCls} w-full aspect-[16/9]`}>
        <img src={photos[0].src} alt={photos[0].alt} className={imgCls} referrerPolicy="no-referrer" loading="lazy" />
      </button>
    );
  }

  if (n === 2) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {photos.map((p, i) => (
          <button key={p.id} type="button" onClick={() => onPhotoClick(i)} className={`${btnCls} aspect-[4/3]`}>
            <img src={p.src} alt={p.alt} className={imgCls} referrerPolicy="no-referrer" loading="lazy" />
          </button>
        ))}
      </div>
    );
  }

  if (n === 3) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:h-[420px]">
        <button type="button" onClick={() => onPhotoClick(0)} className={`${btnCls} aspect-[4/3] md:aspect-auto md:col-span-2 md:row-span-2`}>
          <img src={photos[0].src} alt={photos[0].alt} className={imgCls} referrerPolicy="no-referrer" loading="lazy" />
        </button>
        {photos.slice(1).map((p, i) => (
          <button key={p.id} type="button" onClick={() => onPhotoClick(i + 1)} className={`${btnCls} aspect-[4/3] md:aspect-auto`}>
            <img src={p.src} alt={p.alt} className={imgCls} referrerPolicy="no-referrer" loading="lazy" />
          </button>
        ))}
      </div>
    );
  }

  if (n === 4) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:h-[460px]">
        <button type="button" onClick={() => onPhotoClick(0)} className={`${btnCls} aspect-[4/3] md:aspect-auto md:col-span-2 md:row-span-2`}>
          <img src={photos[0].src} alt={photos[0].alt} className={imgCls} referrerPolicy="no-referrer" loading="lazy" />
        </button>
        {photos.slice(1).map((p, i) => (
          <button key={p.id} type="button" onClick={() => onPhotoClick(i + 1)} className={`${btnCls} aspect-[4/3] md:aspect-auto`}>
            <img src={p.src} alt={p.alt} className={imgCls} referrerPolicy="no-referrer" loading="lazy" />
          </button>
        ))}
      </div>
    );
  }

  // 5+ photos: natural-aspect masonry via CSS columns
  return (
    <div className="columns-2 md:columns-3 gap-2">
      {photos.map((p, i) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onPhotoClick(i)}
          className={`${btnCls} w-full mb-2 break-inside-avoid`}
        >
          <img src={p.src} alt={p.alt} className="w-full h-auto object-cover" referrerPolicy="no-referrer" loading="lazy" />
        </button>
      ))}
    </div>
  );
}

// ── Main Photo Tour overlay ───────────────────────────────────────────────────
type PhotoTourProps = {
  photos: TourPhoto[];
  unitTitle: string;
  onClose: () => void;
};

export default function PhotoTour({ photos, unitTitle, onClose }: PhotoTourProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());
  const navRef = useRef<HTMLDivElement>(null);

  const grouped = groupPhotos(photos);
  const categoryKeys = grouped.map(([cat]) => cat);

  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Escape closes (only when lightbox is not open)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && lightboxIndex === null) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, lightboxIndex]);

  // Initialise active category
  useEffect(() => {
    if (categoryKeys.length > 0 && !activeCategory) setActiveCategory(categoryKeys[0]);
  }, [categoryKeys.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update active category on scroll
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || categoryKeys.length < 2) return;
    const TRIGGER_OFFSET = 170; // sticky header + nav height

    const handleScroll = () => {
      const scrollTop = container.scrollTop + TRIGGER_OFFSET;
      let current = categoryKeys[0];
      for (const cat of categoryKeys) {
        const el = sectionRefs.current.get(cat);
        if (el && el.offsetTop <= scrollTop) current = cat;
      }
      setActiveCategory((prev) => (prev === current ? prev : current));
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [categoryKeys.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll nav pill into view when active category changes
  useEffect(() => {
    if (!navRef.current || !activeCategory) return;
    const btn = navRef.current.querySelector<HTMLElement>(`[data-nav-cat="${CSS.escape(activeCategory)}"]`);
    btn?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeCategory]);

  const scrollToCategory = useCallback((cat: string) => {
    const el = sectionRefs.current.get(cat);
    const container = scrollRef.current;
    if (!el || !container) return;
    const top = el.offsetTop - 154; // header + nav
    container.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    setActiveCategory(cat);
  }, []);

  // Flat index across all photos for the lightbox
  const flatIndex = useCallback(
    (categoryIndex: number, withinCatIndex: number) => {
      let offset = 0;
      for (let i = 0; i < categoryIndex; i++) offset += grouped[i][1].length;
      return offset + withinCatIndex;
    },
    [grouped],
  );

  const allPhotos = photos.slice().sort((a, b) => a.displayOrder - b.displayOrder);

  return createPortal(
    <div
      className="fixed inset-0 z-[9998] bg-surface flex flex-col animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={`Photo tour — ${unitTitle}`}
    >
      {/* ── Sticky header ── */}
      <div className="shrink-0 flex items-center justify-between px-4 md:px-8 h-16 border-b border-outline-variant/20 bg-surface z-10 shadow-sm">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close photo tour"
          className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary rounded"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="hidden sm:inline font-body text-sm">Back</span>
        </button>

        <div className="text-center">
          <h1 className="font-display text-lg text-primary leading-tight">Photo tour</h1>
          <p className="font-body text-[11px] text-on-surface-variant/70 tracking-wide">
            {unitTitle} · {photos.length} photos
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="p-2 rounded-full hover:bg-surface-container transition-colors text-on-surface-variant focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* ── Scrollable body ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain">
        {/* Sticky category nav */}
        {categoryKeys.length > 1 && (
          <div className="sticky top-0 z-10 bg-surface/95 backdrop-blur-sm border-b border-outline-variant/20">
            <div
              ref={navRef}
              className="flex gap-1 overflow-x-auto px-4 md:px-8 py-3"
              style={{ scrollbarWidth: 'none' }}
              role="navigation"
              aria-label="Photo categories"
            >
              {grouped.map(([cat, catPhotos]) => (
                <button
                  key={cat}
                  type="button"
                  data-nav-cat={cat}
                  onClick={() => scrollToCategory(cat)}
                  aria-pressed={activeCategory === cat}
                  className={`shrink-0 flex flex-col items-center gap-1.5 rounded-xl overflow-hidden px-2 pt-2 pb-2 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                    activeCategory === cat
                      ? 'bg-surface-container shadow-sm ring-1 ring-primary/20'
                      : 'hover:bg-surface-container/60'
                  }`}
                >
                  <div className="w-[72px] h-12 rounded-lg overflow-hidden bg-surface-dim shrink-0">
                    <img
                      src={catPhotos[0].src}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <span
                    className={`font-body text-[10px] font-semibold whitespace-nowrap leading-tight ${
                      activeCategory === cat ? 'text-primary' : 'text-on-surface-variant'
                    }`}
                  >
                    {cat}
                  </span>
                  {catPhotos.length > 1 && (
                    <span className="font-body text-[9px] text-on-surface-variant/50 -mt-1">
                      {catPhotos.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Photo sections ── */}
        <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-8 space-y-16">
          {grouped.map(([cat, catPhotos], catIdx) => (
            <section
              key={cat}
              aria-labelledby={`section-${cat}`}
              ref={(el) => {
                if (el) sectionRefs.current.set(cat, el);
              }}
              data-category={cat}
            >
              <h2
                id={`section-${cat}`}
                className="font-display text-headline-sm text-primary mb-6"
              >
                {cat}
              </h2>
              <PhotoGrid
                photos={catPhotos}
                onPhotoClick={(withinIdx) => setLightboxIndex(flatIndex(catIdx, withinIdx))}
              />
            </section>
          ))}
        </div>
      </div>

      {/* ── Lightbox for full-screen single-photo view ── */}
      {lightboxIndex !== null && (
        <Lightbox
          images={allPhotos.map((p) => p.src)}
          startIndex={lightboxIndex}
          alt={unitTitle}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>,
    document.body,
  );
}
