import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ExternalLink, Eye, EyeOff, Pencil, Plus, Search, Star, Trash2, Upload, X } from 'lucide-react';
import { AdminShell } from '../components/admin/AdminShell';
import { ConfirmDialog } from '../components/admin/AdminUI';
import { ADMIN_NAV_ITEMS } from '../components/admin/adminNavigation';
import { useAdminAuth } from '../components/admin/AdminAuthContext';
import { useApi } from '../hooks/useAdminApi';
import { parseAirbnbReviews } from '../lib/parseAirbnbReviews';

const GOLD = '#c5a059';
const NAVY = '#101c2d';
const controlClass = 'bg-[#f9f7f2] border border-navy/10 rounded-lg px-3 py-2.5 font-body text-sm text-navy focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]/20 transition-all';
const labelClass = 'block font-body text-[10px] font-bold uppercase tracking-widest mb-1.5 text-navy/60';

type Review = {
  id: string;
  propertySlug: string;
  name: string | null;
  date: string | null;
  text: string | null;
  rating: number;
  published: boolean;
  displayOrder: number;
  avatarUrl: string | null;
  sourceReviewId: string | null;
  createdAt: string;
  updatedAt?: string;
};

type UnitOption = {
  unitSlug: string;
  unitName: string;
  propertySlug: string;
  propertyName: string;
  visible: boolean;
  airbnbListed?: boolean;
};

type ReviewDraft = {
  ownerSlug: string;
  name: string;
  date: string;
  text: string;
  rating: string;
  avatarUrl: string;
  sourceReviewId: string;
};

const emptyDraft = (ownerSlug = ''): ReviewDraft => ({
  ownerSlug,
  name: '',
  date: '',
  text: '',
  rating: '5',
  avatarUrl: '',
  sourceReviewId: '',
});

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((index) => (
        <Star key={index} size={11} fill={index <= Math.round(rating) ? GOLD : 'none'} color={GOLD} strokeWidth={1.5} />
      ))}
    </div>
  );
}

function Avatar({ name, url }: { name: string | null; url: string | null }) {
  const initials = (name || '?').split(' ').map((word) => word[0]).slice(0, 2).join('').toUpperCase();
  if (url) return <img src={url} alt={name || ''} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />;
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center font-body text-xs font-bold flex-shrink-0"
      style={{ background: `${GOLD}20`, color: GOLD }}
    >
      {initials}
    </div>
  );
}

function SourceBadge({ sourceReviewId }: { sourceReviewId: string | null }) {
  const isAirbnb = Boolean(sourceReviewId);
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full font-body text-[10px] font-semibold uppercase tracking-wide"
      style={isAirbnb
        ? { background: '#FFF0ED', color: '#FF5A5F' }
        : { background: `${NAVY}10`, color: NAVY }}
    >
      {isAirbnb ? 'Airbnb' : 'Manual'}
    </span>
  );
}

function ReviewForm({
  title,
  draft,
  setDraft,
  ownerOptions,
  ownerLocked,
  includeSourceId,
  busy,
  onSubmit,
  onCancel,
}: {
  title: string;
  draft: ReviewDraft;
  setDraft: (next: ReviewDraft) => void;
  ownerOptions: { slug: string; label: string }[];
  ownerLocked: boolean;
  includeSourceId: boolean;
  busy: boolean;
  onSubmit: (event: FormEvent) => void;
  onCancel: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="bg-white border border-navy/10 rounded-xl p-6 mb-6 space-y-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-display text-2xl font-semibold text-navy">{title}</h3>
        <button type="button" onClick={onCancel} className="p-2 rounded-lg hover:bg-navy/5" aria-label="Fechar formulário">
          <X size={16} />
        </button>
      </div>

      <div>
        <label className={labelClass}>Owner slug</label>
        <input
          value={draft.ownerSlug}
          onChange={(event) => setDraft({ ...draft, ownerSlug: event.target.value })}
          list="review-owner-options"
          disabled={ownerLocked}
          required
          className={`${controlClass} w-full disabled:opacity-60`}
          placeholder="Apartment or property slug"
        />
        <datalist id="review-owner-options">
          {ownerOptions.map((option) => <option key={option.slug} value={option.slug}>{option.label}</option>)}
        </datalist>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_100px] gap-4">
        <div>
          <label className={labelClass}>Guest name</label>
          <input
            value={draft.name}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            className={`${controlClass} w-full`}
            placeholder="Guest name"
          />
        </div>
        <div>
          <label className={labelClass}>Date</label>
          <input
            value={draft.date}
            onChange={(event) => setDraft({ ...draft, date: event.target.value })}
            className={`${controlClass} w-full`}
            placeholder="July 2026"
          />
        </div>
        <div>
          <label className={labelClass}>Rating</label>
          <input
            type="number"
            min={1}
            max={5}
            step={0.1}
            value={draft.rating}
            onChange={(event) => setDraft({ ...draft, rating: event.target.value })}
            className={`${controlClass} w-full`}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Review</label>
        <textarea
          value={draft.text}
          onChange={(event) => setDraft({ ...draft, text: event.target.value })}
          rows={4}
          className={`${controlClass} w-full resize-y`}
          placeholder="Review text…"
        />
      </div>

      <div className={`grid grid-cols-1 ${includeSourceId ? 'md:grid-cols-2' : ''} gap-4`}>
        <div>
          <label className={labelClass}>Avatar URL</label>
          <input
            value={draft.avatarUrl}
            onChange={(event) => setDraft({ ...draft, avatarUrl: event.target.value })}
            className={`${controlClass} w-full`}
            placeholder="https://…"
          />
        </div>
        {includeSourceId && (
          <div>
            <label className={labelClass}>Airbnb sourceReviewId</label>
            <input
              value={draft.sourceReviewId}
              onChange={(event) => setDraft({ ...draft, sourceReviewId: event.target.value })}
              className={`${controlClass} w-full`}
              placeholder="Airbnb review ID"
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3">
        <button type="button" onClick={onCancel} className="px-4 py-2 font-body text-xs uppercase tracking-widest text-navy/60">
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy || !draft.ownerSlug.trim()}
          className="px-5 py-2 font-body text-xs uppercase tracking-widest border disabled:opacity-50"
          style={{ borderColor: GOLD, color: GOLD }}
        >
          {busy ? 'Saving…' : 'Save review'}
        </button>
      </div>
    </form>
  );
}

function ReviewsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token, logout } = useAdminAuth();
  const api = useApi(token, logout);

  const unitScope = searchParams.get('unit')?.trim() || '';
  const propertyScope = searchParams.get('property')?.trim() || '';
  const scopeKind: 'unit' | 'property' | null = unitScope ? 'unit' : propertyScope ? 'property' : null;
  const scopeOwner = unitScope || propertyScope;

  const [reviews, setReviews] = useState<Review[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [search, setSearch] = useState('');
  const [filterOwner, setFilterOwner] = useState('');
  const [filterRating, setFilterRating] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterVisibility, setFilterVisibility] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [createOpen, setCreateOpen] = useState(false);
  const [createDraft, setCreateDraft] = useState<ReviewDraft>(() => emptyDraft(scopeOwner));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<ReviewDraft>(() => emptyDraft(scopeOwner));

  const [importOpen, setImportOpen] = useState(false);
  const [importOwner, setImportOwner] = useState(scopeOwner);
  const [importHtml, setImportHtml] = useState('');
  const [importMessage, setImportMessage] = useState('');

  const [confirmTarget, setConfirmTarget] = useState<{ kind: 'single'; id: string } | { kind: 'bulk' } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const reviewPath = scopeOwner
        ? `/admin/reviews?property=${encodeURIComponent(scopeOwner)}`
        : '/admin/reviews';
      const [reviewData, unitData] = await Promise.all([
        api(reviewPath),
        api('/admin/units'),
      ]);
      setReviews(Array.isArray(reviewData) ? reviewData : []);
      setUnits(Array.isArray(unitData?.units) ? unitData.units : []);
      setSelected(new Set());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [api, scopeOwner]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    setCreateDraft(emptyDraft(scopeOwner));
    setImportOwner(scopeOwner);
    setCreateOpen(false);
    setEditingId(null);
  }, [scopeOwner]);

  const unitBySlug = useMemo(
    () => new Map(units.map((unit) => [unit.unitSlug, unit])),
    [units],
  );
  const propertyNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const unit of units) {
      if (unit.propertySlug) map.set(unit.propertySlug, unit.propertyName || unit.propertySlug);
    }
    return map;
  }, [units]);

  const ownerLabel = useCallback((slug: string) => {
    const unit = unitBySlug.get(slug);
    if (unit) return unit.unitName;
    return propertyNames.get(slug) || slug;
  }, [propertyNames, unitBySlug]);

  const ownerOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const unit of units) {
      map.set(unit.unitSlug, `${unit.unitName} — ${unit.propertyName}`);
      if (unit.propertySlug) map.set(unit.propertySlug, `${unit.propertyName} — property`);
    }
    for (const review of reviews) {
      if (!map.has(review.propertySlug)) map.set(review.propertySlug, review.propertySlug);
    }
    return [...map.entries()]
      .map(([slug, label]) => ({ slug, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [reviews, units]);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return reviews.filter((review) => {
      if (query && ![
        review.name,
        review.text,
        review.propertySlug,
        ownerLabel(review.propertySlug),
        review.sourceReviewId,
      ].some((value) => (value || '').toLowerCase().includes(query))) return false;
      if (filterOwner && review.propertySlug !== filterOwner) return false;
      if (filterRating && String(review.rating) !== filterRating) return false;
      if (filterSource === 'airbnb' && !review.sourceReviewId) return false;
      if (filterSource === 'manual' && review.sourceReviewId) return false;
      if (filterVisibility === 'published' && !review.published) return false;
      if (filterVisibility === 'hidden' && review.published) return false;
      return true;
    });
  }, [filterOwner, filterRating, filterSource, filterVisibility, ownerLabel, reviews, search]);

  const averageRating = reviews.length
    ? (reviews.reduce((sum, review) => sum + (Number(review.rating) || 0), 0) / reviews.length).toFixed(1)
    : '—';
  const hasFilter = search || filterOwner || filterRating || filterSource || filterVisibility;
  const allFilteredSelected = filtered.length > 0 && filtered.every((review) => selected.has(review.id));

  function clearFilters() {
    setSearch('');
    setFilterOwner('');
    setFilterRating('');
    setFilterSource('');
    setFilterVisibility('');
  }

  function toggleSelected(id: string) {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllFiltered() {
    setSelected((previous) => {
      const next = new Set(previous);
      if (allFilteredSelected) filtered.forEach((review) => next.delete(review.id));
      else filtered.forEach((review) => next.add(review.id));
      return next;
    });
  }

  async function createReview(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const ownerReviews = reviews.filter((review) => review.propertySlug === createDraft.ownerSlug);
      await api('/admin/reviews', {
        method: 'POST',
        body: JSON.stringify({
          propertySlug: createDraft.ownerSlug.trim(),
          name: createDraft.name.trim() || null,
          date: createDraft.date.trim() || null,
          text: createDraft.text.trim() || null,
          rating: Number(createDraft.rating) || 5,
          avatarUrl: createDraft.avatarUrl.trim() || null,
          displayOrder: Math.max(0, ...ownerReviews.map((review) => review.displayOrder || 0)) + 1,
        }),
      });
      setCreateOpen(false);
      setCreateDraft(emptyDraft(scopeOwner));
      await load();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Failed to create review');
    } finally {
      setBusy(false);
    }
  }

  function startEdit(review: Review) {
    setEditingId(review.id);
    setCreateOpen(false);
    setEditDraft({
      ownerSlug: review.propertySlug,
      name: review.name || '',
      date: review.date || '',
      text: review.text || '',
      rating: String(review.rating),
      avatarUrl: review.avatarUrl || '',
      sourceReviewId: review.sourceReviewId || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function saveEdit(event: FormEvent) {
    event.preventDefault();
    if (!editingId) return;
    setBusy(true);
    setError('');
    try {
      await api(`/admin/reviews/${editingId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editDraft.name.trim() || null,
          date: editDraft.date.trim() || null,
          text: editDraft.text.trim() || null,
          rating: Number(editDraft.rating) || 5,
          avatarUrl: editDraft.avatarUrl.trim() || null,
          sourceReviewId: editDraft.sourceReviewId.trim() || null,
        }),
      });
      setEditingId(null);
      await load();
    } catch (editError) {
      setError(editError instanceof Error ? editError.message : 'Failed to update review');
    } finally {
      setBusy(false);
    }
  }

  async function toggleVisibility(review: Review) {
    const nextPublished = !review.published;
    setReviews((previous) => previous.map((item) =>
      item.id === review.id ? { ...item, published: nextPublished } : item));
    try {
      await api(`/admin/reviews/${review.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ published: nextPublished }),
      });
    } catch (toggleError) {
      setReviews((previous) => previous.map((item) =>
        item.id === review.id ? { ...item, published: review.published } : item));
      setError(toggleError instanceof Error ? toggleError.message : 'Failed to update visibility');
    }
  }

  async function bulkSetPublished(published: boolean) {
    const ids = [...selected];
    if (!ids.length) return;
    setBusy(true);
    setError('');
    try {
      await Promise.all(ids.map((id) => api(`/admin/reviews/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ published }),
      })));
      setReviews((previous) => previous.map((review) =>
        selected.has(review.id) ? { ...review, published } : review));
      setSelected(new Set());
    } catch (bulkError) {
      setError(bulkError instanceof Error ? bulkError.message : 'Bulk visibility update failed');
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!confirmTarget) return;
    const ids = confirmTarget.kind === 'single' ? [confirmTarget.id] : [...selected];
    setBusy(true);
    setError('');
    try {
      await Promise.all(ids.map((id) => api(`/admin/reviews/${id}`, { method: 'DELETE' })));
      setReviews((previous) => previous.filter((review) => !ids.includes(review.id)));
      setSelected(new Set());
      if (editingId && ids.includes(editingId)) setEditingId(null);
      setConfirmTarget(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete review');
      setConfirmTarget(null);
      await load();
    } finally {
      setBusy(false);
    }
  }

  function readImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    file.text().then(setImportHtml).catch(() => setImportMessage('Failed to read HTML file.'));
  }

  async function importReviews() {
    setImportMessage('');
    setError('');
    const owner = importOwner.trim();
    if (!owner) {
      setImportMessage('Choose an apartment or property owner first.');
      return;
    }
    const parsed = parseAirbnbReviews(importHtml);
    if (!parsed.length) {
      setImportMessage('No Airbnb reviews were found in this HTML.');
      return;
    }
    setBusy(true);
    try {
      const result = await api('/admin/reviews/import', {
        method: 'POST',
        body: JSON.stringify({ propertySlug: owner, reviews: parsed }),
      });
      setImportMessage(`${result.added} imported · ${result.skipped} duplicate${result.skipped === 1 ? '' : 's'} skipped`);
      setImportHtml('');
      await load();
    } catch (importError) {
      setImportMessage(importError instanceof Error ? importError.message : 'Import failed');
    } finally {
      setBusy(false);
    }
  }

  const scopeLabel = scopeOwner ? ownerLabel(scopeOwner) : '';

  return (
    <AdminShell
      navItems={ADMIN_NAV_ITEMS}
      activeId="reviews"
      breadcrumbs={[{ label: 'Reviews' }, ...(scopeOwner ? [{ label: scopeLabel }] : [])]}
    >
      <div
        className="-mx-4 md:-mx-10 -mt-10 px-4 md:px-8 pt-8 pb-6 mb-8"
        style={{ background: '#f9f7f2', borderBottom: '1px solid rgba(16,28,45,0.07)' }}
      >
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-display text-3xl font-bold mb-1" style={{ color: NAVY }}>Guest Reviews</h2>
            <p className="font-body text-sm" style={{ color: `${NAVY}70` }}>
              {reviews.length} reviews · avg {averageRating} ★
            </p>
            {scopeOwner && (
              <p className="font-body text-xs mt-1" style={{ color: GOLD }}>
                {scopeKind === 'unit' ? 'Apartment' : 'Property'}: {scopeLabel} ({scopeOwner})
                {' · '}
                <Link to="/admin/reviews" className="underline">clear scope</Link>
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setImportOpen((open) => !open); setCreateOpen(false); setEditingId(null); }}
              className="flex items-center gap-2 px-4 py-2.5 font-body text-[11px] uppercase tracking-widest border"
              style={{ borderColor: NAVY, color: NAVY }}
            >
              <Upload size={14} /> Import Airbnb
            </button>
            <button
              onClick={() => { setCreateOpen(true); setImportOpen(false); setEditingId(null); setCreateDraft(emptyDraft(scopeOwner)); }}
              className="flex items-center gap-2 px-4 py-2.5 font-body text-[11px] uppercase tracking-widest border"
              style={{ borderColor: GOLD, color: GOLD }}
            >
              <Plus size={14} /> Create review
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-5 border border-red-200 bg-red-50/60 rounded-lg px-4 py-3 font-body text-sm text-red-700">
          {error}
        </div>
      )}

      {createOpen && (
        <ReviewForm
          title="Create review"
          draft={createDraft}
          setDraft={setCreateDraft}
          ownerOptions={ownerOptions}
          ownerLocked={Boolean(scopeOwner)}
          includeSourceId={false}
          busy={busy}
          onSubmit={createReview}
          onCancel={() => setCreateOpen(false)}
        />
      )}

      {editingId && (
        <ReviewForm
          title="Edit review"
          draft={editDraft}
          setDraft={setEditDraft}
          ownerOptions={ownerOptions}
          ownerLocked
          includeSourceId
          busy={busy}
          onSubmit={saveEdit}
          onCancel={() => setEditingId(null)}
        />
      )}

      {importOpen && (
        <div className="bg-white border border-navy/10 rounded-xl p-6 mb-6 space-y-4 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-display text-2xl font-semibold text-navy">Import Airbnb HTML</h3>
              <p className="font-body text-xs text-navy/50 mt-1">
                Paste copied Airbnb review HTML. Existing sourceReviewId values are skipped for this owner.
              </p>
            </div>
            <Link to="/admin?tab=coletor" className="font-body text-[10px] uppercase tracking-widest underline" style={{ color: GOLD }}>
              Open advanced collector/CSV →
            </Link>
          </div>
          <div>
            <label className={labelClass}>Owner slug</label>
            <input
              value={importOwner}
              onChange={(event) => setImportOwner(event.target.value)}
              list="review-owner-options"
              disabled={Boolean(scopeOwner)}
              className={`${controlClass} w-full disabled:opacity-60`}
              placeholder="Apartment or property slug"
            />
          </div>
          <textarea
            value={importHtml}
            onChange={(event) => setImportHtml(event.target.value)}
            rows={7}
            className={`${controlClass} w-full resize-y font-mono text-xs`}
            placeholder="Paste Airbnb review HTML…"
          />
          <div className="flex items-center gap-3 flex-wrap">
            <input type="file" accept=".html,text/html" onChange={readImportFile} className="font-body text-xs text-navy/60" />
            <button
              onClick={importReviews}
              disabled={busy || !importHtml.trim() || !importOwner.trim()}
              className="px-4 py-2 font-body text-[11px] uppercase tracking-widest border disabled:opacity-50"
              style={{ borderColor: GOLD, color: GOLD }}
            >
              {busy ? 'Importing…' : 'Import reviews'}
            </button>
            {importMessage && <span className="font-body text-xs text-navy/60">{importMessage}</span>}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: `${NAVY}50` }} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search guest, content, owner or source ID…"
            className={`${controlClass} pl-9 w-full`}
          />
        </div>

        {!scopeOwner && (
          <select value={filterOwner} onChange={(event) => setFilterOwner(event.target.value)} className={controlClass}>
            <option value="">All Owners</option>
            {ownerOptions.map((option) => <option key={option.slug} value={option.slug}>{option.label}</option>)}
          </select>
        )}

        <select value={filterRating} onChange={(event) => setFilterRating(event.target.value)} className={controlClass}>
          <option value="">All Ratings</option>
          {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={String(rating)}>{rating} ★</option>)}
        </select>

        <select value={filterSource} onChange={(event) => setFilterSource(event.target.value)} className={controlClass}>
          <option value="">All Sources</option>
          <option value="airbnb">Airbnb</option>
          <option value="manual">Manual</option>
        </select>

        <select value={filterVisibility} onChange={(event) => setFilterVisibility(event.target.value)} className={controlClass}>
          <option value="">All Visibility</option>
          <option value="published">Published</option>
          <option value="hidden">Hidden</option>
        </select>

        {hasFilter && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 font-body text-xs px-3 py-2.5 rounded-lg border hover:bg-red-50"
            style={{ borderColor: `${NAVY}20`, color: `${NAVY}70` }}
          >
            <X size={12} /> Clear
          </button>
        )}
      </div>

      {selected.size > 0 && (
        <div className="sticky top-0 z-20 mb-5 flex items-center gap-3 flex-wrap px-4 py-3 text-white shadow-lg" style={{ background: NAVY }}>
          <span className="font-body text-sm">{selected.size} selected</span>
          <button disabled={busy} onClick={() => bulkSetPublished(true)} className="font-body text-xs px-3 py-1.5 border border-white/30 disabled:opacity-50">
            Publish
          </button>
          <button disabled={busy} onClick={() => bulkSetPublished(false)} className="font-body text-xs px-3 py-1.5 border border-white/30 disabled:opacity-50">
            Hide
          </button>
          <button
            disabled={busy}
            onClick={() => setConfirmTarget({ kind: 'bulk' })}
            className="font-body text-xs px-3 py-1.5 border border-red-300 text-red-200 disabled:opacity-50"
          >
            Delete
          </button>
          <button onClick={() => setSelected(new Set())} className="ml-auto font-body text-xs text-white/60">Clear selection</button>
        </div>
      )}

      <p className="font-body text-xs mb-4" style={{ color: `${NAVY}50` }}>{filtered.length} of {reviews.length} reviews</p>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden" style={{ border: '1px solid rgba(16,28,45,0.05)' }}>
        {loading ? (
          <div className="px-6 py-16 text-center font-body text-sm text-navy/50">Loading reviews…</div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-16 text-center font-body text-sm text-navy/50">No reviews found.</div>
        ) : (
          <>
            <div
              className="hidden md:grid grid-cols-[32px_auto_1fr_180px_90px_100px_140px] gap-4 items-center px-6 py-3 border-b"
              style={{ borderColor: `${NAVY}08`, background: '#fafaf9' }}
            >
              <input
                type="checkbox"
                checked={allFilteredSelected}
                onChange={toggleAllFiltered}
                aria-label="Select all filtered reviews"
                className="accent-[#C5A059]"
              />
              {['Guest', 'Content', 'Owner', 'Source', 'Visibility', 'Actions'].map((heading) => (
                <span key={heading} className="font-label text-[10px] font-bold uppercase tracking-widest" style={{ color: `${NAVY}50` }}>
                  {heading}
                </span>
              ))}
            </div>

            <div className="divide-y" style={{ borderColor: `${NAVY}06` }}>
              {filtered.map((review) => {
                const unit = unitBySlug.get(review.propertySlug);
                return (
                  <div key={review.id}>
                    <div className="hidden md:grid grid-cols-[32px_auto_1fr_180px_90px_100px_140px] gap-4 items-center px-6 py-4 hover:bg-gray-50/70">
                      <input
                        type="checkbox"
                        checked={selected.has(review.id)}
                        onChange={() => toggleSelected(review.id)}
                        aria-label={`Select review by ${review.name || 'Unknown'}`}
                        className="accent-[#C5A059]"
                      />
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar name={review.name} url={review.avatarUrl} />
                        <div className="min-w-0">
                          <p className="font-body text-sm font-semibold truncate text-navy">{review.name || 'Unknown'}</p>
                          <Stars rating={review.rating} />
                          <p className="font-body text-[10px] text-navy/40">{review.date || '—'}</p>
                        </div>
                      </div>
                      <p className="font-body text-xs line-clamp-2 text-navy/70">{review.text ? `"${review.text}"` : '—'}</p>
                      <div className="min-w-0">
                        <p className="font-body text-xs truncate text-navy">{ownerLabel(review.propertySlug)}</p>
                        <p className="font-mono text-[10px] truncate text-navy/40">{review.propertySlug}</p>
                      </div>
                      <SourceBadge sourceReviewId={review.sourceReviewId} />
                      <span
                        className="inline-flex justify-center px-2.5 py-1 rounded-full font-body text-[10px] font-semibold uppercase"
                        style={review.published
                          ? { background: '#E8F5E9', color: '#2E7D32' }
                          : { background: `${NAVY}10`, color: `${NAVY}70` }}
                      >
                        {review.published ? 'Published' : 'Hidden'}
                      </span>
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => startEdit(review)} title="Edit" className="p-2 rounded-lg hover:bg-gray-100">
                          <Pencil size={14} style={{ color: `${NAVY}60` }} />
                        </button>
                        <button onClick={() => toggleVisibility(review)} title={review.published ? 'Hide' : 'Publish'} className="p-2 rounded-lg hover:bg-gray-100">
                          {review.published ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        {unit && (
                          <button onClick={() => navigate(`/admin/apartments/${unit.unitSlug}`)} title="Open apartment" className="p-2 rounded-lg hover:bg-gray-100">
                            <ExternalLink size={14} />
                          </button>
                        )}
                        <button onClick={() => setConfirmTarget({ kind: 'single', id: review.id })} title="Delete" className="p-2 rounded-lg hover:bg-red-50">
                          <Trash2 size={14} className="text-red-400" />
                        </button>
                      </div>
                    </div>

                    <div className="md:hidden px-4 py-4">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selected.has(review.id)}
                          onChange={() => toggleSelected(review.id)}
                          aria-label={`Select review by ${review.name || 'Unknown'}`}
                          className="mt-2 accent-[#C5A059]"
                        />
                        <Avatar name={review.name} url={review.avatarUrl} />
                        <div className="flex-1 min-w-0">
                          <p className="font-body text-sm font-semibold text-navy">{review.name || 'Unknown'}</p>
                          <Stars rating={review.rating} />
                          <p className="font-body text-xs mt-2 line-clamp-3 text-navy/70">{review.text || '—'}</p>
                          <p className="font-body text-[11px] mt-2 text-navy/50">{ownerLabel(review.propertySlug)}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-1 mt-2">
                        <SourceBadge sourceReviewId={review.sourceReviewId} />
                        <button onClick={() => startEdit(review)} className="p-2"><Pencil size={14} /></button>
                        <button onClick={() => toggleVisibility(review)} className="p-2">
                          {review.published ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button onClick={() => setConfirmTarget({ kind: 'single', id: review.id })} className="p-2">
                          <Trash2 size={14} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmTarget !== null}
        title={confirmTarget?.kind === 'bulk' ? 'Delete selected reviews' : 'Delete review'}
        message={confirmTarget?.kind === 'bulk'
          ? `Delete ${selected.size} selected review${selected.size === 1 ? '' : 's'}? This cannot be undone.`
          : 'Delete this review? This cannot be undone.'}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmTarget(null)}
      />
    </AdminShell>
  );
}

export default function AdminReviews() {
  return <ReviewsPage />;
}
