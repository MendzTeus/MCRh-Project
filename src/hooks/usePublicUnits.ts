import { useState, useEffect } from 'react';

export type PublicUnit = {
  unitSlug: string;
  unitName: string;
  propertySlug: string;
  propertyName: string;
  suppliedSpecs: string | null;
  postcode: string | null;
  airbnbUrl: string | null;
  description: string | null;
  primaryImage: string | null;
  photos: { url: string; alt: string | null; isPrimary: boolean }[];
};

export type PublicUnitsState = {
  overrides: Map<string, PublicUnit>; // keyed by unitSlug — DB values to layer over static data
  hidden: Set<string>;                // unitSlugs the admin has hidden
  loaded: boolean;
};

const EMPTY: PublicUnitsState = { overrides: new Map(), hidden: new Set(), loaded: false };

// Fetched once per page load and shared across pages via this module-level cache.
let cache: Promise<{ units: PublicUnit[]; hiddenSlugs: string[] }> | null = null;
function fetchOnce() {
  if (!cache) {
    cache = fetch('/api/content/units')
      .then((r) => r.json())
      // On any failure return an empty overlay → the site falls back to the
      // static data untouched (never blank, never wrongly hides everything).
      .catch(() => ({ units: [], hiddenSlugs: [] }));
  }
  return cache;
}

/**
 * Returns DB overrides + hidden set to layer over the static inventory.
 * While loading (or if the API is unreachable) it returns an empty overlay,
 * so callers should always fall back to their static data.
 */
export function usePublicUnits(): PublicUnitsState {
  const [state, setState] = useState<PublicUnitsState>(EMPTY);

  useEffect(() => {
    let active = true;
    fetchOnce().then((data) => {
      if (!active) return;
      const overrides = new Map<string, PublicUnit>();
      (data.units || []).forEach((u) => overrides.set(u.unitSlug, u));
      setState({ overrides, hidden: new Set(data.hiddenSlugs || []), loaded: true });
    });
    return () => { active = false; };
  }, []);

  return state;
}
