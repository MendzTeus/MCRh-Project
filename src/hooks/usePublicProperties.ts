import { useEffect, useState } from 'react';

export type PublicPropertyFields = {
  slug: string;
  name: string;
  area: string | null;
  eyebrow: string | null;
  neighborhoodTitle: string | null;
  description: string;
};

type PublicPropertiesState = {
  bySlug: Map<string, PublicPropertyFields>;
  loaded: boolean;
  error: string | null;
};

const EMPTY: PublicPropertiesState = {
  bySlug: new Map(),
  loaded: false,
  error: null,
};

let cache: Promise<PublicPropertyFields[]> | null = null;

function fetchOnce() {
  if (!cache) {
    cache = fetch('/api/content/properties').then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load properties');
      return Array.isArray(data) ? data : [];
    });
  }
  return cache;
}

export function usePublicProperties(): PublicPropertiesState {
  const [state, setState] = useState<PublicPropertiesState>(EMPTY);

  useEffect(() => {
    let active = true;
    fetchOnce()
      .then((rows) => {
        if (!active) return;
        setState({
          bySlug: new Map(rows.map((row) => [row.slug, row])),
          loaded: true,
          error: null,
        });
      })
      .catch((error) => {
        if (!active) return;
        setState({
          bySlug: new Map(),
          loaded: true,
          error: error instanceof Error ? error.message : 'Could not load properties',
        });
      });
    return () => { active = false; };
  }, []);

  return state;
}
