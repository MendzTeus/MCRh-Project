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

export function useAvailability(property: string, checkIn: string, checkOut: string): AvailabilityResult {
  const [result, setResult] = useState<AvailabilityResult>({
    units: [],
    configured: false,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!checkIn || !checkOut) {
      setResult({ units: [], configured: false, loading: false, error: null });
      return;
    }

    let cancelled = false;
    setResult((r) => ({ ...r, loading: true, error: null }));

    fetch(`/api/availability?property=${property}&checkIn=${checkIn}&checkOut=${checkOut}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setResult({ units: data.units || [], configured: data.configured ?? false, loading: false, error: null });
      })
      .catch((err) => {
        if (cancelled) return;
        setResult({ units: [], configured: false, loading: false, error: err.message });
      });

    // Ignore this request's result if the inputs change before it resolves,
    // so a slow earlier response can't overwrite a newer selection.
    return () => { cancelled = true; };
  }, [property, checkIn, checkOut]);

  return result;
}
