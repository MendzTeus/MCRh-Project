import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type BeforeAfterSliderProps = {
  beforeSrc: string;
  beforeAlt: string;
  afterSrc: string;
  afterAlt: string;
};

export default function BeforeAfterSlider({
  beforeSrc,
  beforeAlt,
  afterSrc,
  afterAlt,
}: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(50);
  const [focused, setFocused] = useState(false);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-surface-dim shadow-xl select-none">
      <img
        src={afterSrc}
        alt={afterAlt}
        className="absolute inset-0 h-full w-full object-cover"
        width="1920"
        height="1080"
        loading="lazy"
        decoding="async"
      />
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <img
          src={beforeSrc}
          alt={beforeAlt}
          className="absolute inset-0 h-full w-full max-w-none object-cover"
          width="1920"
          height="1080"
          loading="lazy"
          decoding="async"
        />
      </div>

      <span className="absolute left-4 top-4 z-10 rounded-full bg-black/65 px-4 py-2 font-body text-[10px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
        Before
      </span>
      <span className="absolute right-4 top-4 z-10 rounded-full bg-white/90 px-4 py-2 font-body text-[10px] font-semibold uppercase tracking-[0.18em] text-primary backdrop-blur-sm">
        After
      </span>

      <input
        type="range"
        min="0"
        max="100"
        value={position}
        onChange={(event) => setPosition(Number(event.target.value))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-label="Compare the apartment before and after the design transformation"
        aria-valuetext={`${position}% before, ${100 - position}% after`}
        className="absolute inset-0 z-30 h-full w-full cursor-ew-resize opacity-0"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 z-20 w-px bg-white shadow-[0_0_12px_rgba(0,0,0,0.45)]"
        style={{ left: `${position}%` }}
      >
        <span
          className={`absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-primary text-white shadow-lg transition-shadow ${
            focused ? 'ring-4 ring-secondary/50' : ''
          }`}
        >
          <ChevronLeft className="h-4 w-4" />
          <ChevronRight className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}
