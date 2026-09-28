import { useCallback, useEffect, useState } from 'react';
import type { useApi } from './useAdminApi';
import type { SaveContent } from '../components/admin/content/ContentFields';
import type { AdminProperty, SiteData, Unit } from '../components/admin/sections/shared';

type Api = ReturnType<typeof useApi>;
type Loadable = { loaded: boolean; error: string | null };

const errorMessage = (err: unknown) => (err instanceof Error ? err.message : 'Falha ao carregar');

/**
 * Site texts + page images. `saveContent` persists one key and patches local
 * state only — the screen never reloads while someone is editing.
 */
export function useAdminSite(api: Api) {
  const [site, setSite] = useState<SiteData>({ content: {}, images: {} });
  const [status, setStatus] = useState<Loadable>({ loaded: false, error: null });

  const reload = useCallback(async () => {
    try {
      const data = await api('/admin/site');
      setSite({ content: data?.content || {}, images: data?.images || {} });
      setStatus({ loaded: true, error: null });
    } catch (err) {
      setStatus({ loaded: true, error: errorMessage(err) });
    }
  }, [api]);

  useEffect(() => { reload(); }, [reload]);

  const saveContent = useCallback<SaveContent>(async (key, value) => {
    const path = `/admin/content/${encodeURIComponent(key)}`;
    if (value === undefined) await api(path, { method: 'DELETE' });
    else await api(path, { method: 'PUT', body: JSON.stringify({ value }) });
    setSite((prev) => {
      const content = { ...prev.content };
      if (value === undefined) delete content[key]; else content[key] = value;
      return { ...prev, content };
    });
  }, [api]);

  const onImageChanged = useCallback((slot: string, url: string | null) => {
    setSite((prev) => {
      const images = { ...prev.images };
      if (url) images[slot] = { url, alt: images[slot]?.alt ?? null }; else delete images[slot];
      return { ...prev, images };
    });
  }, []);

  return { site, ...status, reload, saveContent, onImageChanged };
}

/** Apartments (with photos). `reload` refreshes in place, without a loading screen. */
export function useAdminUnits(api: Api) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [status, setStatus] = useState<Loadable>({ loaded: false, error: null });

  const reload = useCallback(async () => {
    try {
      const data = await api('/admin/units');
      setUnits(Array.isArray(data?.units) ? data.units : []);
      setStatus({ loaded: true, error: null });
    } catch (err) {
      setStatus({ loaded: true, error: errorMessage(err) });
    }
  }, [api]);

  useEffect(() => { reload(); }, [reload]);
  return { units, ...status, reload };
}

/** Buildings/collections (canonical name, area, description…). */
export function useAdminProperties(api: Api) {
  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [status, setStatus] = useState<Loadable>({ loaded: false, error: null });

  const reload = useCallback(async () => {
    try {
      const data = await api('/admin/properties');
      setProperties(Array.isArray(data?.properties) ? data.properties : []);
      setStatus({ loaded: true, error: null });
    } catch (err) {
      setStatus({ loaded: true, error: errorMessage(err) });
    }
  }, [api]);

  useEffect(() => { reload(); }, [reload]);

  const replaceProperty = useCallback((updated: AdminProperty) => {
    setProperties((current) => current.map((p) => (p.slug === updated.slug ? updated : p)));
  }, []);

  return { properties, ...status, reload, replaceProperty };
}
