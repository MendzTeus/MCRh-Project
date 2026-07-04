import { getPropertyImage } from '../data/listingMedia';

type MediaImageProps = {
  propertySlug?: string;
  src?: string;
  index?: number;
  alt: string;
  className?: string;
  loading?: 'eager' | 'lazy';
};

export default function MediaImage({
  propertySlug,
  src,
  index = 0,
  alt,
  className = 'h-full w-full object-cover',
  loading = 'lazy',
}: MediaImageProps) {
  const imageSrc = src || getPropertyImage(propertySlug, index);

  if (!imageSrc) {
    return <div className="w-full h-full bg-surface-variant"></div>;
  }

  return <img src={imageSrc} alt={alt} className={className} loading={loading} width="800" height="600" decoding="async" referrerPolicy="no-referrer" />;
}
