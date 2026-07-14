import { useState, useEffect } from 'react';

export type PropertyPhoto = { id: string; url: string; alt: string | null; isPrimary: boolean; displayOrder: number };

const cache = new Map<string, Promise<PropertyPhoto[]>>();

function fetchPhotos(slug: string): Promise<PropertyPhoto[]> {
  if (!cache.has(slug)) {
    cache.set(slug, fetch(`/api/content/properties/${slug}/photos`).then((r) => r.json()).catch(() => []));
  }
  return cache.get(slug)!;
}

export function usePropertyPhotos(slug: string) {
  const [photos, setPhotos] = useState<PropertyPhoto[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let live = true;
    fetchPhotos(slug).then((p) => { if (live) { setPhotos(p); setLoaded(true); } });
    return () => { live = false; };
  }, [slug]);

  const primary = photos.find((p) => p.isPrimary) || photos[0] || null;
  const gallery = photos.map((p) => p.url);

  return { photos, primary, gallery, loaded };
}
