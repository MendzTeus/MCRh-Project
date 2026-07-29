import { useState, useEffect } from 'react';

export type UnitAvailability = {
  unitSlug: string;
  unitName: string;
  available: boolean;
  hasIcal: boolean;
};

export type AvailabilityResult = {
  units: UnitAvailability[];
  configured: boolean;
  loading: boolean;
  error: string | null;
};

export function useAvailability(
  property: string,
  checkIn: string,
  checkOut: string,
  unitSlugs?: string[],
): AvailabilityResult {
  const [result, setResult] = useState<AvailabilityResult>({
    units: [],
    configured: false,
    loading: false,
    error: null,
  });
  const unitSlugsKey = unitSlugs?.join(',') ?? null;

  useEffect(() => {
    if (!checkIn || !checkOut || (unitSlugsKey !== null && !unitSlugsKey)) {
      setResult({ units: [], configured: false, loading: false, error: null });
      return;
    }

    let cancelled = false;
    setResult((r) => ({ ...r, loading: true, error: null }));

    const params = new URLSearchParams({ checkIn, checkOut });
    const endpoint = unitSlugsKey !== null
      ? (() => {
          params.set('unitSlugs', unitSlugsKey);
          return '/api/availability/units';
        })()
      : (() => {
          params.set('property', property);
          return '/api/availability';
        })();

    fetch(`${endpoint}?${params.toString()}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not check availability');
        return data;
      })
      .then((data) => {
        if (cancelled) return;
        const units: UnitAvailability[] = Array.isArray(data.units)
          ? data.units
          : Object.entries(data.units || {}).map(([unitSlug, available]) => ({
              unitSlug,
              unitName: unitSlug,
              available: Boolean(available),
              hasIcal: true,
            }));
        setResult({ units, configured: data.configured ?? false, loading: false, error: null });
      })
      .catch((err) => {
        if (cancelled) return;
        setResult({ units: [], configured: false, loading: false, error: err.message });
      });

    // Ignore this request's result if the inputs change before it resolves,
    // so a slow earlier response can't overwrite a newer selection.
    return () => { cancelled = true; };
  }, [property, checkIn, checkOut, unitSlugsKey]);

  return result;
}
