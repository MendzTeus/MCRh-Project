import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface PhotoGalleryProps {
  images: string[];
  alt?: string;
}

export default function PhotoGallery({ images, alt = 'Property photo' }: PhotoGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const close = useCallback(() => setLightboxIndex(null), []);
  const prev = useCallback(() => setLightboxIndex((i) => (i !== null ? (i - 1 + images.length) % images.length : 0)), [images.length]);
  const next = useCallback(() => setLightboxIndex((i) => (i !== null ? (i + 1) % images.length : 0)), [images.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxIndex, close, prev, next]);

  if (!images.length) return null;

  const [primary, ...rest] = images;

  return (
    <>
      {/* Grid */}
      <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[520px]">
        {/* Main large image */}
        <button
          type="button"
          onClick={() => setLightboxIndex(0)}
          className="col-span-2 row-span-2 overflow-hidden rounded-l-xl cursor-pointer group relative"
        >
          <img src={primary} alt={alt} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        </button>
        {/* Up to 4 thumbnails */}
        {rest.slice(0, 4).map((src, i) => (
          <button
            type="button"
            key={src}
            onClick={() => setLightboxIndex(i + 1)}
            className={`overflow-hidden cursor-pointer group relative ${i === 3 ? 'rounded-br-xl' : ''} ${i === 1 ? 'rounded-tr-xl' : ''}`}
          >
            <img src={src} alt={`${alt} ${i + 2}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            {i === 3 && images.length > 5 && (
              <div className="absolute inset-0 bg-primary/50 flex items-center justify-center">
                <span className="font-body text-white text-sm font-semibold tracking-widest">+{images.length - 5} photos</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center"
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-8 h-8" />
          </button>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors p-2"
            aria-label="Previous"
          >
            <ChevronLeft className="w-10 h-10" />
          </button>

          <img
            src={images[lightboxIndex]}
            alt={`${alt} ${lightboxIndex + 1}`}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors p-2"
            aria-label="Next"
          >
            <ChevronRight className="w-10 h-10" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 font-body text-white/60 text-sm tracking-widest">
            {lightboxIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}
