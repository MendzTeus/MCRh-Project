type MediaImageProps = {
  src: string;
  alt: string;
  className?: string;
};

export default function MediaImage({ src, alt, className = '' }: MediaImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      className={`h-full w-full object-cover ${className}`}
      loading="lazy"
    />
  );
}
