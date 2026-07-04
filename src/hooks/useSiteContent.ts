import { useState, useEffect } from 'react';

type SiteData = {
  content: Record<string, unknown>;
  images: Record<string, { url: string; alt: string | null }>;
};

const EMPTY: SiteData & { loaded: boolean } = { content: {}, images: {}, loaded: false };

// Fetched once per page load, shared across components.
let cache: Promise<SiteData> | null = null;
function fetchOnce() {
  if (!cache) {
    cache = fetch('/api/content/site')
      .then((r) => r.json())
      // On failure return an empty overlay → components fall back to their
      // hardcoded defaults, so the public site never breaks.
      .catch(() => ({ content: {}, images: {} }));
  }
  return cache;
}

export function useSiteContent() {
  const [state, setState] = useState(EMPTY);
  useEffect(() => {
    let active = true;
    fetchOnce().then((d) => { if (active) setState({ content: d.content || {}, images: d.images || {}, loaded: true }); });
    return () => { active = false; };
  }, []);
  return state;
}

// Small typed helpers with fallback to the hardcoded default.
export function text(content: Record<string, unknown>, key: string, fallback: string): string {
  const v = content[key];
  return typeof v === 'string' && v.length ? v : fallback;
}
export function list<T>(content: Record<string, unknown>, key: string, fallback: T[]): T[] {
  const v = content[key];
  return Array.isArray(v) ? (v as T[]) : fallback;
}
