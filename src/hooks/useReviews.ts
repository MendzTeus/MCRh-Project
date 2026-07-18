import { useState, useEffect } from 'react';
import type { Review } from '../data/reviews';

// Fetches published reviews for a property from the DB. While loading (or if the
// API is unreachable) it returns loaded:false so callers can fall back to the
// static reviews and never render a blank section.
type State = { reviews: Review[]; loaded: boolean };

const cache = new Map<string, Promise<Review[]>>();
function fetchOnce(key: string): Promise<Review[]> {
  let p = cache.get(key);
  if (!p) {
    p = fetch(`/api/content/reviews?property=${encodeURIComponent(key)}`)
      .then((r) => r.json())
      .then((rows) => (Array.isArray(rows) ? rows : []))
      .catch(() => []);
    cache.set(key, p);
  }
  return p;
}

export function useReviews(propertySlug: string | string[]): State {
  const key = (Array.isArray(propertySlug) ? propertySlug : [propertySlug]).filter(Boolean).join(',');
  const [state, setState] = useState<State>({ reviews: [], loaded: false });

  useEffect(() => {
    let active = true;
    if (!key) {
      setState({ reviews: [], loaded: true });
      return () => { active = false; };
    }
    fetchOnce(key).then((rows) => {
      if (!active) return;
      setState({ reviews: rows, loaded: true });
    });
    return () => { active = false; };
  }, [key]);

  return state;
}
