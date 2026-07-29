import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Edit, Search, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { AdminShell } from '../components/admin/AdminShell';
import { ConfirmDialog, ErrorState, SaveStatus } from '../components/admin/AdminUI';
import { ADMIN_NAV_ITEMS } from '../components/admin/adminNavigation';
import { useApi } from '../hooks/useAdminApi';
import { useAdminAuth } from '../components/admin/AdminAuthContext';

const GOLD = '#c5a059';
const NAVY = '#101c2d';
const CREAM = '#f9f8f4';
const PAGE_SIZE = 20;

type Photo = { id: string; url: string; alt: string | null; isPrimary: boolean };
type Unit = {
  unitSlug: string;
  unitName: string;
  propertySlug: string;
  propertyName: string;
  visible: boolean;
  airbnbListed?: boolean;
  displayOrder: number;
  photos: Photo[];
  updatedAt?: string;
};
type MutationFeedback = {
  status: 'idle' | 'saving' | 'saved' | 'error';
  error?: string;
};
type BulkAction = 'show' | 'hide' | 'feature' | 'unfeature';
type BulkFailure = { unitSlug: string; unitName: string; error: string };
type BulkResult = {
  action: BulkAction;
  succeeded: number;
  failures: BulkFailure[];
};

const BULK_ACTION_LABELS: Record<BulkAction, string> = {
  show: 'Show selected',
  hide: 'Hide selected',
  feature: 'Add to featured',
  unfeature: 'Remove from featured',
};

function formatUpdatedAt(value?: string) {
  if (!value) return { label: '—', title: 'No update date available' };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { label: '—', title: 'Invalid update date' };
  return {
    label: date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    title: date.toLocaleString('en-GB'),
  };
}

// ── Visibility toggle ────────────────────────────────────────────────
function VisiToggle({ checked, disabled, onChange }: { checked: boolean; disabled: boolean; onChange: () => void }) {
  return (
    <label
      className={`relative inline-flex items-center ${disabled ? 'cursor-wait opacity-50' : 'cursor-pointer'}`}
      title={disabled ? 'Saving visibility…' : checked ? 'Visible — click to hide' : 'Hidden — click to publish'}
    >
      <input type="checkbox" className="sr-only peer" checked={checked} disabled={disabled} onChange={onChange} />
      <div
        className="w-9 h-5 rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"
        style={{ background: checked ? GOLD : '#d1d5db' }}
      />
    </label>
  );
}

// ── Pagination ───────────────────────────────────────────────────────
function Pagination({ page, pageCount, total, pageSize, onPage }: {
  page: number; pageCount: number; total: number; pageSize: number; onPage: (p: number) => void;
}) {
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const pages = Array.from({ length: Math.min(pageCount, 5) }, (_, i) => {
    if (pageCount <= 5) return i + 1;
    if (page <= 3) return i + 1;
    if (page >= pageCount - 2) return pageCount - 4 + i;
    return page - 2 + i;
  });

  return (
    <div
      className="px-6 py-4 flex justify-between items-center border-t"
      style={{ background: `${NAVY}08`, borderColor: `${NAVY}08` }}
    >
      <p className="font-body text-xs" style={{ color: `${NAVY}60` }}>
        Showing <span className="font-bold">{from}–{to}</span> of {total} apartments
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="p-1 rounded-md transition-colors disabled:opacity-30"
          style={{ color: `${NAVY}60` }}
        >
          <ChevronLeft size={20} />
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPage(p)}
            className="w-8 h-8 rounded-md font-body text-xs font-medium transition-colors"
            style={p === page
              ? { background: GOLD, color: NAVY, fontWeight: 700 }
              : { color: `${NAVY}60` }
            }
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === pageCount}
          className="p-1 rounded-md transition-colors disabled:opacity-30"
          style={{ color: `${NAVY}60` }}
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────
function ApartmentsList() {
  const navigate = useNavigate();
  const { token, logout } = useAdminAuth();
  const api = useApi(token, logout);

  const [units, setUnits] = useState<Unit[]>([]);
  const [featuredSlugs, setFeaturedSlugs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const [visiFilter, setVisiFilter] = useState<'all' | 'visible' | 'hidden'>('all');
  const [page, setPage] = useState(1);
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());
  const [visibilityFeedback, setVisibilityFeedback] = useState<Record<string, MutationFeedback>>({});
  const [featuredFeedback, setFeaturedFeedback] = useState<Record<string, MutationFeedback>>({});
  const [bulkAction, setBulkAction] = useState<BulkAction | null>(null);
  const [bulkPending, setBulkPending] = useState(false);
  const [bulkResult, setBulkResult] = useState<BulkResult | null>(null);

  const load = useCallback(async () => {
    setLoadError('');
    try {
      const [unitsData, siteData] = await Promise.all([
        api('/admin/units'),
        api('/admin/site'),
      ]);
      if (!Array.isArray(unitsData?.units)) throw new Error('Invalid apartments response');
      setUnits(unitsData.units);

      const featured = siteData?.content?.['home.featured'];
      setFeaturedSlugs(Array.isArray(featured) ? featured.filter((slug): slug is string => typeof slug === 'string') : []);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Failed to load apartments');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { load(); }, [load]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [query, groupFilter, visiFilter]);

  const propertyOptions = [...new Map<string, string>(units.map((u) => [u.propertySlug, u.propertyName])).entries()]
    .map(([slug, name]) => ({ slug, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const filtered = units
    .filter((u) => {
      const q = query.toLowerCase();
      return !q || u.unitName.toLowerCase().includes(q) || u.propertyName.toLowerCase().includes(q) || u.unitSlug.includes(q);
    })
    .filter((u) => groupFilter === 'all' || u.propertySlug === groupFilter)
    .filter((u) => visiFilter === 'all' || (visiFilter === 'visible' ? u.visible : !u.visible))
    .sort((a, b) => {
      const byProp = String(a.propertyName).localeCompare(String(b.propertyName));
      if (byProp !== 0) return byProp;
      const byOrder = a.displayOrder - b.displayOrder;
      if (byOrder !== 0) return byOrder;
      return String(a.unitName).localeCompare(String(b.unitName));
    });

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pageCount);
  const pageUnits = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);
  const allPageSelected = pageUnits.length > 0 && pageUnits.every((unit) => selectedSlugs.has(unit.unitSlug));

  function toggleSelected(unitSlug: string) {
    setSelectedSlugs((previous) => {
      const next = new Set(previous);
      if (next.has(unitSlug)) next.delete(unitSlug);
      else next.add(unitSlug);
      return next;
    });
  }

  function togglePageSelection() {
    setSelectedSlugs((previous) => {
      const next = new Set(previous);
      if (allPageSelected) pageUnits.forEach((unit) => next.delete(unit.unitSlug));
      else pageUnits.forEach((unit) => next.add(unit.unitSlug));
      return next;
    });
  }

  async function toggleVisibility(unit: Unit) {
    if (visibilityFeedback[unit.unitSlug]?.status === 'saving') return;

    const previousVisible = unit.visible;
    const nextVisible = !previousVisible;
    setUnits((prev) => prev.map((u) => u.unitSlug === unit.unitSlug ? { ...u, visible: nextVisible } : u));
    setVisibilityFeedback((prev) => ({
      ...prev,
      [unit.unitSlug]: { status: 'saving' },
    }));

    try {
      await api(`/admin/units/${unit.unitSlug}`, {
        method: 'PATCH',
        body: JSON.stringify({ visible: nextVisible }),
      });
      setVisibilityFeedback((prev) => ({
        ...prev,
        [unit.unitSlug]: { status: 'saved' },
      }));
      window.setTimeout(() => {
        setVisibilityFeedback((prev) => {
          if (prev[unit.unitSlug]?.status !== 'saved') return prev;
          return { ...prev, [unit.unitSlug]: { status: 'idle' } };
        });
      }, 1500);
    } catch (error) {
      setUnits((prev) => prev.map((u) => u.unitSlug === unit.unitSlug ? { ...u, visible: previousVisible } : u));
      setVisibilityFeedback((prev) => ({
        ...prev,
        [unit.unitSlug]: {
          status: 'error',
          error: error instanceof Error ? error.message : 'Failed to update visibility',
        },
      }));
    }
  }

  async function applyBulkAction() {
    const action = bulkAction;
    if (!action || selectedSlugs.size === 0 || bulkPending) return;

    const selectedUnits = units.filter((unit) => selectedSlugs.has(unit.unitSlug));
    if (selectedUnits.length === 0) {
      setSelectedSlugs(new Set());
      setBulkAction(null);
      return;
    }

    setBulkPending(true);
    setBulkResult(null);

    try {
      if (action === 'show' || action === 'hide') {
        const visible = action === 'show';
        setVisibilityFeedback((previous) => {
          const next = { ...previous };
          selectedUnits.forEach((unit) => { next[unit.unitSlug] = { status: 'saving' }; });
          return next;
        });

        const results = await Promise.all(selectedUnits.map(async (unit) => {
          try {
            await api(`/admin/units/${unit.unitSlug}`, {
              method: 'PATCH',
              body: JSON.stringify({ visible }),
            });
            return { unit, error: null };
          } catch (error) {
            return {
              unit,
              error: error instanceof Error ? error.message : 'Failed to update visibility',
            };
          }
        }));

        const failures = results
          .filter((result): result is typeof result & { error: string } => result.error !== null)
          .map(({ unit, error }) => ({ unitSlug: unit.unitSlug, unitName: unit.unitName, error }));
        const failedBySlug = new Map(failures.map((failure) => [failure.unitSlug, failure.error]));

        setVisibilityFeedback((previous) => {
          const next = { ...previous };
          selectedUnits.forEach((unit) => {
            const error = failedBySlug.get(unit.unitSlug);
            next[unit.unitSlug] = error ? { status: 'error', error } : { status: 'saved' };
          });
          return next;
        });
        setBulkResult({ action, succeeded: selectedUnits.length - failures.length, failures });

        const succeededSlugs = selectedUnits
          .filter((unit) => !failedBySlug.has(unit.unitSlug))
          .map((unit) => unit.unitSlug);
        window.setTimeout(() => {
          setVisibilityFeedback((previous) => {
            const next = { ...previous };
            succeededSlugs.forEach((unitSlug) => {
              if (next[unitSlug]?.status === 'saved') next[unitSlug] = { status: 'idle' };
            });
            return next;
          });
        }, 2000);
      } else {
        setFeaturedFeedback((previous) => {
          const next = { ...previous };
          selectedUnits.forEach((unit) => { next[unit.unitSlug] = { status: 'saving' }; });
          return next;
        });

        const selectedInListOrder = units
          .filter((unit) => selectedSlugs.has(unit.unitSlug))
          .map((unit) => unit.unitSlug);
        const current = new Set(featuredSlugs);
        const nextFeatured = action === 'feature'
          ? [...featuredSlugs, ...selectedInListOrder.filter((unitSlug) => !current.has(unitSlug))]
          : featuredSlugs.filter((unitSlug) => !selectedSlugs.has(unitSlug));

        try {
          await api('/admin/content/home.featured', {
            method: 'PUT',
            body: JSON.stringify({ value: nextFeatured }),
          });
          setFeaturedSlugs(nextFeatured);
          setFeaturedFeedback((previous) => {
            const next = { ...previous };
            selectedUnits.forEach((unit) => { next[unit.unitSlug] = { status: 'saved' }; });
            return next;
          });
          setBulkResult({ action, succeeded: selectedUnits.length, failures: [] });
          window.setTimeout(() => {
            setFeaturedFeedback((previous) => {
              const next = { ...previous };
              selectedUnits.forEach((unit) => {
                if (next[unit.unitSlug]?.status === 'saved') next[unit.unitSlug] = { status: 'idle' };
              });
              return next;
            });
          }, 2000);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to update featured apartments';
          const failures = selectedUnits.map((unit) => ({
            unitSlug: unit.unitSlug,
            unitName: unit.unitName,
            error: message,
          }));
          setFeaturedFeedback((previous) => {
            const next = { ...previous };
            selectedUnits.forEach((unit) => { next[unit.unitSlug] = { status: 'error', error: message }; });
            return next;
          });
          setBulkResult({ action, succeeded: 0, failures });
        }
      }

      await load();
    } finally {
      setSelectedSlugs(new Set());
      setBulkAction(null);
      setBulkPending(false);
    }
  }

  return (
    <AdminShell
      navItems={ADMIN_NAV_ITEMS}
      activeId="apartments"
      breadcrumbs={[{ label: 'Admin' }, { label: 'Apartments' }]}
      rightSlot={
        <button
          onClick={logout}
          className="font-body text-[10px] uppercase tracking-[0.15em] text-white/50 hover:text-white transition-colors"
        >
          Sair
        </button>
      }
    >
      <div style={{ background: CREAM, minHeight: '100%' }} className="-mx-4 md:-mx-10 -mt-10 px-4 md:px-10 pt-10 pb-12">

        {/* Page header */}
        <div className="mb-10">
          <div>
            <h2 className="font-headline text-4xl mb-1" style={{ color: NAVY }}>Apartments</h2>
            <p className="font-body text-sm" style={{ color: `${NAVY}60` }}>Manage and monitor your serviced luxury residences.</p>
          </div>
        </div>

        {/* Filter row */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-navy/5 flex flex-wrap items-center gap-6 mb-8" style={{ borderColor: `${NAVY}08` }}>
          <div className="flex-1 min-w-[280px] relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: `${NAVY}40` }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, property, or ID…"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border font-body text-sm focus:outline-none focus:ring-1 transition-colors"
              style={{ background: `${CREAM}80`, borderColor: `${NAVY}12`, color: NAVY }}
            />
          </div>
          <div className="flex items-center gap-4">
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="rounded-lg border text-sm px-4 py-2.5 font-body focus:outline-none focus:ring-1 transition-colors"
              style={{ background: `${CREAM}80`, borderColor: `${NAVY}12`, color: `${NAVY}B0` }}
            >
              <option value="all">All Properties</option>
              {propertyOptions.map(({ slug, name }) => (
                <option key={slug} value={slug}>{name}</option>
              ))}
            </select>
            <select
              value={visiFilter}
              onChange={(e) => setVisiFilter(e.target.value as typeof visiFilter)}
              className="rounded-lg border text-sm px-4 py-2.5 font-body focus:outline-none focus:ring-1 transition-colors"
              style={{ background: `${CREAM}80`, borderColor: `${NAVY}12`, color: `${NAVY}B0` }}
            >
              <option value="all">Visibility</option>
              <option value="visible">Published</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>
          {(query || groupFilter !== 'all' || visiFilter !== 'all') && (
            <button
              onClick={() => { setQuery(''); setGroupFilter('all'); setVisiFilter('all'); }}
              className="font-body text-sm font-semibold hover:underline transition-all"
              style={{ color: GOLD }}
            >
              Clear filters
            </button>
          )}
        </div>

        {selectedSlugs.size > 0 && (
          <div
            className="sticky top-0 z-20 mb-6 flex items-center gap-3 flex-wrap px-5 py-4 rounded-xl text-white shadow-lg"
            style={{ background: NAVY }}
            role="region"
            aria-label="Bulk apartment actions"
          >
            <span className="font-body text-sm font-semibold mr-2">{selectedSlugs.size} selected</span>
            {(['show', 'hide', 'feature', 'unfeature'] as const).map((action) => (
              <button
                key={action}
                type="button"
                disabled={bulkPending}
                onClick={() => setBulkAction(action)}
                className="px-3 py-2 border border-white/30 rounded-lg font-body text-[10px] uppercase tracking-widest hover:bg-white/10 disabled:opacity-40"
              >
                {BULK_ACTION_LABELS[action]}
              </button>
            ))}
            <button
              type="button"
              disabled={bulkPending}
              onClick={() => setSelectedSlugs(new Set())}
              className="ml-auto font-body text-xs text-white/60 hover:text-white disabled:opacity-40"
            >
              Clear selection
            </button>
          </div>
        )}

        {bulkResult && (
          <div
            className={`mb-6 rounded-xl border px-5 py-4 font-body text-sm ${
              bulkResult.failures.length > 0 ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'
            }`}
            role={bulkResult.failures.length > 0 ? 'alert' : 'status'}
            aria-live="polite"
          >
            <p className="font-semibold">
              {BULK_ACTION_LABELS[bulkResult.action]}: {bulkResult.succeeded} updated, {bulkResult.failures.length} failed.
            </p>
            {bulkResult.failures.length > 0 && (
              <ul className="mt-2 space-y-1">
                {bulkResult.failures.map((failure) => (
                  <li key={failure.unitSlug}>
                    {failure.unitName} ({failure.unitSlug}): {failure.error}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden" style={{ border: `1px solid ${NAVY}08` }}>
          {loadError ? (
            <div className="px-6 py-12 text-center">
              <ErrorState message={`Failed to load apartments: ${loadError}`} />
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-24 font-body text-sm" style={{ color: `${NAVY}40` }}>
              Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-2">
              <p className="font-body text-sm" style={{ color: `${NAVY}40` }}>No apartments match the current filters.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr
                      className="font-label text-[10px] uppercase tracking-widest border-b"
                      style={{ background: '#fafaf9', color: `${NAVY}50`, borderColor: `${NAVY}08` }}
                    >
                      <th className="px-4 py-4 w-10">
                        <input
                          type="checkbox"
                          checked={allPageSelected}
                          disabled={bulkPending}
                          onChange={togglePageSelection}
                          aria-label={allPageSelected ? 'Deselect apartments on this page' : 'Select apartments on this page'}
                          className="w-4 h-4 accent-[#C5A059]"
                        />
                      </th>
                      <th className="px-4 py-4 w-14">Photo</th>
                      <th className="px-4 py-4">Name</th>
                      <th className="px-4 py-4">Building</th>
                      <th className="px-4 py-4 text-center">Visibility</th>
                      <th className="px-4 py-4 text-center">Featured</th>
                      <th className="px-4 py-4 text-center">Airbnb</th>
                      <th className="px-4 py-4">Updated</th>
                      <th className="px-4 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="font-body text-sm divide-y" style={{ color: NAVY, borderColor: `${NAVY}08` }}>
                    {pageUnits.map((unit) => {
                      const primaryPhoto = unit.photos.find((p) => p.isPrimary) ?? unit.photos[0];
                      const feedback = visibilityFeedback[unit.unitSlug] ?? { status: 'idle' as const };
                      const featuredStatus = featuredFeedback[unit.unitSlug] ?? { status: 'idle' as const };
                      const isFeatured = featuredSlugs.includes(unit.unitSlug);
                      const updated = formatUpdatedAt(unit.updatedAt);
                      return (
                        <tr
                          key={unit.unitSlug}
                          className="transition-colors"
                          style={{ opacity: unit.visible ? 1 : 0.65 }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = `${CREAM}80`)}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          {/* Selection */}
                          <td className="px-4 py-4">
                            <input
                              type="checkbox"
                              checked={selectedSlugs.has(unit.unitSlug)}
                              disabled={bulkPending}
                              onChange={() => toggleSelected(unit.unitSlug)}
                              aria-label={`Select ${unit.unitName}`}
                              className="w-4 h-4 accent-[#C5A059]"
                            />
                          </td>

                          {/* Photo */}
                          <td className="px-4 py-4">
                            <div
                              className="w-12 h-12 rounded-lg overflow-hidden border shadow-sm flex items-center justify-center"
                              style={{ background: `${NAVY}08`, borderColor: `${NAVY}12` }}
                            >
                              {primaryPhoto ? (
                                <img
                                  src={primaryPhoto.url}
                                  alt={primaryPhoto.alt ?? unit.unitName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="font-body text-[10px] uppercase tracking-wider" style={{ color: `${NAVY}30` }}>–</span>
                              )}
                            </div>
                          </td>

                          {/* Name */}
                          <td className="px-4 py-4" style={{ color: NAVY }}>
                            <p className="font-semibold">{unit.unitName}</p>
                            <p className="font-mono text-[10px] mt-0.5" style={{ color: `${NAVY}45` }}>{unit.unitSlug}</p>
                          </td>

                          {/* Building */}
                          <td className="px-4 py-4" style={{ color: `${NAVY}60` }}>
                            {unit.propertyName}
                          </td>

                          {/* Visibility toggle */}
                          <td className="px-4 py-4 text-center">
                            <div className="flex flex-col items-center gap-1" aria-live="polite">
                              <VisiToggle
                                checked={unit.visible}
                                disabled={bulkPending || feedback.status === 'saving'}
                                onChange={() => void toggleVisibility(unit)}
                              />
                              <SaveStatus status={feedback.status} error={feedback.error} />
                            </div>
                          </td>

                          {/* Featured on homepage — read-only in Phase 1 */}
                          <td className="px-4 py-4 text-center">
                            <div className="flex flex-col items-center gap-1" aria-live="polite">
                              <span
                                className="inline-flex items-center justify-center"
                                title={isFeatured ? 'Featured on homepage' : 'Not featured on homepage'}
                                aria-label={isFeatured ? 'Featured on homepage' : 'Not featured on homepage'}
                              >
                                <Star
                                  size={17}
                                  fill={isFeatured ? GOLD : 'none'}
                                  strokeWidth={isFeatured ? 2 : 1.5}
                                  style={{ color: isFeatured ? GOLD : `${NAVY}25` }}
                                  aria-hidden="true"
                                />
                              </span>
                              <SaveStatus status={featuredStatus.status} error={featuredStatus.error} />
                            </div>
                          </td>

                          {/* Airbnb listing health */}
                          <td className="px-4 py-4 text-center">
                            {unit.airbnbListed === false ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700">
                                Inactive
                              </span>
                            ) : unit.airbnbListed === true ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                                Active
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500">
                                Unknown
                              </span>
                            )}
                          </td>

                          {/* Last updated */}
                          <td className="px-4 py-4 text-xs whitespace-nowrap" style={{ color: `${NAVY}60` }} title={updated.title}>
                            {updated.label}
                          </td>

                          {/* Actions: View + Edit */}
                          <td className="px-4 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <a
                                href={unit.propertySlug ? `/properties/${unit.propertySlug}/${unit.unitSlug}` : `/property/${unit.unitSlug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded transition-colors"
                                title="View on site"
                                style={{ color: `${NAVY}50` }}
                                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = GOLD)}
                                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = `${NAVY}50`)}
                              >
                                <Eye size={17} />
                              </a>
                              <button
                                onClick={() => navigate(`/admin/apartments/${unit.unitSlug}`)}
                                className="p-1.5 rounded transition-colors"
                                title="Edit"
                                style={{ color: `${NAVY}50` }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = GOLD)}
                                onMouseLeave={(e) => (e.currentTarget.style.color = `${NAVY}50`)}
                              >
                                <Edit size={17} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {pageCount > 1 && (
                <Pagination
                  page={pageSafe}
                  pageCount={pageCount}
                  total={filtered.length}
                  pageSize={PAGE_SIZE}
                  onPage={setPage}
                />
              )}
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={bulkAction !== null}
        title={bulkAction ? BULK_ACTION_LABELS[bulkAction] : 'Bulk action'}
        message={bulkAction
          ? `${BULK_ACTION_LABELS[bulkAction]} for ${selectedSlugs.size} apartment${selectedSlugs.size === 1 ? '' : 's'}? This changes what guests can see on the public site.`
          : ''}
        confirmLabel={bulkPending ? 'Applying…' : 'Apply changes'}
        onConfirm={() => void applyBulkAction()}
        onCancel={() => { if (!bulkPending) setBulkAction(null); }}
      />
    </AdminShell>
  );
}

// ── Export ───────────────────────────────────────────────────────────
export default function AdminApartmentsList() {
  return <ApartmentsList />;
}
