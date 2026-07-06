import { useState, useEffect, useRef, useCallback, type TouchEvent } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { createPortal } from 'react-dom';

type LightboxProps = {
  images: string[];
  startIndex?: number;
  alt?: string;
  onClose: () => void;
};

/**
 * Full-screen photo lightbox: centred, uncropped images on a translucent dark
 * backdrop, with a sliding track between photos, arrow + swipe navigation, a
 * position indicator and a thumbnail strip. Rendered into a portal.
 */
export default function Lightbox({ images, startIndex = 0, alt = 'Photo', onClose }: LightboxProps) {
  const [index, setIndex] = useState(startIndex);
  const touchStartX = useRef<number | null>(null);
  const count = images.length;

  const go = useCallback(
    (dir: number) => setIndex((i) => (i + dir + count) % count),
    [count],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    // Lock background scroll while the lightbox is open.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [go, onClose]);

  if (!count) return null;

  function handleTouchStart(e: TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e: TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
    touchStartX.current = null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex flex-col animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Photo gallery"
      onClick={onClose}
    >
      {/* Top bar: counter + close */}
      <div className="flex items-center justify-between px-4 md:px-6 py-4 text-white/80" onClick={(e) => e.stopPropagation()}>
        <span className="font-body text-sm tracking-widest tabular-nums">{index + 1} / {count}</span>
        <button
          onClick={onClose}
          aria-label="Close gallery"
          className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/80 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Stage */}
      <div className="relative flex-1 overflow-hidden" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div
          className="flex h-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {images.map((src, i) => (
            <div
              key={i}
              className="min-w-full h-full flex items-center justify-center px-4 md:px-20 py-2"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={src}
                alt={`${alt} ${i + 1}`}
                referrerPolicy="no-referrer"
                draggable={false}
                className="max-w-full max-h-full object-contain select-none rounded-lg shadow-2xl"
              />
            </div>
          ))}
        </div>

        {count > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); go(-1); }}
              aria-label="Previous photo"
              className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 p-2 md:p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <ChevronLeft className="w-6 h-6 md:w-7 md:h-7" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); go(1); }}
              aria-label="Next photo"
              className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 p-2 md:p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <ChevronRight className="w-6 h-6 md:w-7 md:h-7" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {count > 1 && (
        <div className="hidden md:flex gap-2 justify-center px-6 py-4 overflow-x-auto" onClick={(e) => e.stopPropagation()}>
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Go to photo ${i + 1}`}
              className={`h-14 w-20 shrink-0 rounded-md overflow-hidden border-2 transition-all ${
                i === index ? 'border-white opacity-100' : 'border-transparent opacity-50 hover:opacity-80'
              }`}
            >
              <img src={src} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body,
  );
}
