// Split out of the former single-file admin (src/pages/Admin.tsx).
import type { ReactNode } from 'react';

// Quiet Luxury signature accent
export const GOLD = '#C5A059';
export const NAVY = '#101c2d';

// ── Types ───────────────────────────────────────────────────────────
export type Photo = { id: string; url: string; alt: string | null; isPrimary: boolean; displayOrder: number; roomCategory: string | null; hidden?: boolean };
export type Unit = {
  unitSlug: string; unitName: string; propertySlug: string; propertyName: string;
  suppliedSpecs: string | null; postcode: string | null; airbnbUrl: string | null;
  description: string | null; squareFeet: number | null; icalAirbnbUrl: string | null; icalVrboUrl: string | null;
  displayTitle: string | null; visible: boolean; airbnbListed?: boolean; displayOrder: number; photos: Photo[]; updatedAt?: string;
};
export type SiteData = { content: Record<string, unknown>; images: Record<string, { url: string; alt: string | null }> };
export type AdminProperty = {
  slug: string;
  name: string;
  area: string | null;
  eyebrow: string | null;
  neighborhoodTitle: string | null;
  description: string;
  // null = the site uses the built-in value from properties.ts
  headline?: string | null;
  amenities?: unknown;
  nearby?: unknown;
  maxGuests?: number | null;
  bedrooms?: number | null;
  beds?: number | null;
  bathrooms?: number | null;
  displayOrder: number | null;
  updatedAt: string;
};

// ── Shared primitives (Quiet Luxury) ────────────────────────────────
export const label = 'font-body text-[10px] uppercase tracking-[0.15em] text-on-surface-variant block mb-1.5';
export const field = 'w-full bg-transparent border-b border-outline-variant/50 py-1.5 font-body text-sm text-on-surface focus:outline-none focus:border-[#C5A059] transition-colors';

export function Btn({ children, onClick, gold, disabled, type }: { children: ReactNode; onClick?: () => void; gold?: boolean; disabled?: boolean; type?: 'button' | 'submit' }) {
  const c = gold ? GOLD : '#101c2d';
  return (
    <button type={type || 'button'} onClick={onClick} disabled={disabled}
      className="px-6 py-2.5 rounded-lg font-body text-[11px] uppercase tracking-[0.15em] transition-colors disabled:opacity-40"
      style={{ border: `1px solid ${c}`, color: c, background: 'transparent' }}
      onMouseEnter={(e) => { if (!disabled) { e.currentTarget.style.background = c; e.currentTarget.style.color = '#fff'; } }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = c; }}>
      {children}
    </button>
  );
}

export function Status({ s }: { s: 'idle' | 'saving' | 'saved' | 'error' }) {
  return (
    <span className="font-body text-[10px] uppercase tracking-[0.15em]" style={{ color: s === 'error' ? '#ba1a1a' : GOLD }}>
      {s === 'saving' && 'Salvando…'}{s === 'saved' && '✓ Salvo'}{s === 'error' && 'Erro'}
    </span>
  );
}

