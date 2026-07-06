import { useState, useEffect } from 'react';

export type BlockedRange = { start: string; end: string };

/**
 * Fetches the ICS-synced blocked date ranges for a single unit so the booking
 * calendar can disable dates that are already reserved. Returns an empty list
 * while loading or if the API is unreachable (fail open — the Airbnb link is
 * still the source of truth on submit).
 */
export function useUnitBlockedDates(unitSlug?: string): BlockedRange[] {
  const [ranges, setRanges] = useState<BlockedRange[]>([]);

  useEffect(() => {
    if (!unitSlug) {
      setRanges([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/availability/calendar?unitSlug=${encodeURIComponent(unitSlug)}`)
      .then((r) => r.json())
      .then((data) => { if (!cancelled) setRanges(Array.isArray(data.blocked) ? data.blocked : []); })
      .catch(() => { if (!cancelled) setRanges([]); });
    return () => { cancelled = true; };
  }, [unitSlug]);

  return ranges;
}
