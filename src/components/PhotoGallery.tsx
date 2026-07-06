import { useState } from 'react';
import Lightbox from './Lightbox';

interface PhotoGalleryProps {
  images: string[];
  alt?: string;
}

export default function PhotoGallery({ images, alt = 'Property photo' }: PhotoGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

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
        <Lightbox images={images} startIndex={lightboxIndex} alt={alt} onClose={() => setLightboxIndex(null)} />
      )}
    </>
  );
}
