import { Link } from 'react-router-dom';
import MediaImage from './MediaImage';

type Props = {
  propertySlug: string;
  eyebrow: string;
  name: string;
  description: string;
  collectionSlug: string;
  cta: string;
  quote?: string;
  imageLayout: 'stack' | 'grid';
  tinted?: boolean;
  sectionId?: string;
  compact?: boolean;
};

export default function PropertyFeatureSection({
  propertySlug,
  eyebrow,
  name,
  description,
  collectionSlug,
  cta,
  quote,
  imageLayout,
  tinted = false,
  sectionId,
  compact = false,
}: Props) {
  const sectionCls = tinted
    ? 'py-section-gap px-margin-mobile md:px-margin-desktop bg-surface-container-low border-y border-outline-variant/30'
    : 'py-section-gap px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto';

  const innerCls = tinted ? 'max-w-[1280px] mx-auto ' : '';
  const gap = compact ? 'gap-16 lg:gap-24' : 'gap-8 md:gap-16';
  const textSize = compact ? 'text-body-lg' : 'text-body-md';
  const textOpacity = compact ? 'opacity-90' : 'opacity-80';
  const textPad = compact ? '' : imageLayout === 'stack' ? 'md:pl-12' : 'md:pr-12';
  const imgHeightStack = compact
    ? 'h-[360px] sm:h-[500px] md:h-[700px]'
    : 'h-[600px] md:h-[800px]';
  const imgHeightGrid = compact
    ? 'h-[360px] sm:h-[500px] md:h-[700px]'
    : 'h-[600px] md:h-[700px]';

  const textBlock = (
    <div className={`md:col-span-5 ${textPad} mt-12 md:mt-0`}>
      <span className="inline-block font-body text-label-caps text-secondary mb-4 md:mb-6 tracking-widest uppercase">
        {eyebrow}
      </span>
      <h2 className="font-display text-headline-md text-primary mb-6">{name}</h2>
      <p className={`font-body ${textSize} text-on-surface-variant mb-8 md:mb-10 ${textOpacity} leading-relaxed`}>
        {description}
      </p>
      <Link
        to={`/collection/${collectionSlug}`}
        className="inline-flex items-center justify-center border border-primary text-primary px-8 py-4 font-body text-label-caps tracking-widest uppercase hover:bg-surface-dim transition-colors duration-300"
      >
        {cta}
      </Link>
    </div>
  );

  const stackImages = (
    <div className={`md:col-span-7 relative ${imgHeightStack}`}>
      <div className="absolute top-0 left-0 w-[85%] h-[85%] rounded-lg overflow-hidden shadow-sm bg-surface-dim">
        <MediaImage propertySlug={propertySlug} index={0} alt={`${name} apartment`} />
      </div>
      <div className="absolute bottom-0 right-0 w-[55%] h-[55%] rounded-lg overflow-hidden shadow-2xl z-10 bg-surface-dim border border-outline-variant/30">
        <MediaImage propertySlug={propertySlug} index={1} alt={`${name} detail`} />
      </div>
    </div>
  );

  const gridImages = (
    <div className={`md:col-span-7 order-1 md:order-2`}>
      <div className={`grid grid-cols-2 gap-4 ${imgHeightGrid}`}>
        <div className="col-span-1 row-span-2 rounded-lg overflow-hidden bg-primary">
          <MediaImage propertySlug={propertySlug} index={0} alt={`${name} apartment`} />
        </div>
        <div className="col-span-1 row-span-1 rounded-lg overflow-hidden bg-surface-dim">
          <MediaImage propertySlug={propertySlug} index={1} alt={`${name} interior detail`} />
        </div>
        <div className="col-span-1 row-span-1 rounded-lg overflow-hidden bg-surface-container-lowest flex items-center justify-center p-8 border border-outline-variant/30">
          <p className="font-display text-2xl md:text-3xl text-primary text-center leading-snug">
            "{quote}"
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <section id={sectionId} className={sectionCls}>
      <div className={`${innerCls}grid grid-cols-1 md:grid-cols-12 ${gap} items-center`}>
        {imageLayout === 'stack' ? (
          <>
            {stackImages}
            {textBlock}
          </>
        ) : (
          <>
            <div className={`md:col-span-5 ${textPad} order-2 md:order-1 mt-12 md:mt-0`}>
              <span className="inline-block font-body text-label-caps text-secondary mb-4 md:mb-6 tracking-widest uppercase">
                {eyebrow}
              </span>
              <h2 className="font-display text-headline-md text-primary mb-6">{name}</h2>
              <p className={`font-body ${textSize} text-on-surface-variant mb-8 md:mb-10 ${textOpacity} leading-relaxed`}>
                {description}
              </p>
              <Link
                to={`/collection/${collectionSlug}`}
                className="inline-flex items-center justify-center border border-primary text-primary px-8 py-4 font-body text-label-caps tracking-widest uppercase hover:bg-surface-dim transition-colors duration-300"
              >
                {cta}
              </Link>
            </div>
            {gridImages}
          </>
        )}
      </div>
    </section>
  );
}
