import { useState, useEffect, useCallback, useRef, useMemo, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Star } from 'lucide-react';
import { getInventoryForProperty } from '../data/airbnbInventory';
import { ROOM_CATEGORIES } from '../components/PhotoTour';
import { useApi, fileToBase64 } from '../hooks/useAdminApi';
import { ContentEditor } from '../components/admin/content/ContentEditor';
import type { SaveContent } from '../components/admin/content/ContentFields';
import { PropertyContentFields } from '../components/admin/content/PropertyContentFields';
import { AdminShell } from '../components/admin/AdminShell';
import { ConfirmDialog } from '../components/admin/AdminUI';
import { ADMIN_NAV_ITEMS, getAdminNavPath, getLegacyAdminTab } from '../components/admin/adminNavigation';
import { useAdminAuth } from '../components/admin/AdminAuthContext';
import {
  MediaGrid,
  getMediaKey,
  useMediaMutations,
  type MediaItem,
  type MediaOwner,
} from '../components/admin/media';

// Quiet Luxury signature accent
const GOLD = '#C5A059';
const NAVY = '#101c2d';

// ── Types ───────────────────────────────────────────────────────────
type Photo = { id: string; url: string; alt: string | null; isPrimary: boolean; displayOrder: number; roomCategory: string | null; hidden?: boolean };
type Unit = {
  unitSlug: string; unitName: string; propertySlug: string; propertyName: string;
  suppliedSpecs: string | null; postcode: string | null; airbnbUrl: string | null;
  description: string | null; squareFeet: number | null; icalAirbnbUrl: string | null; icalVrboUrl: string | null;
  displayTitle: string | null; visible: boolean; airbnbListed?: boolean; displayOrder: number; photos: Photo[]; updatedAt?: string;
};
type SiteData = { content: Record<string, unknown>; images: Record<string, { url: string; alt: string | null }> };
type AdminProperty = {
  slug: string;
  name: string;
  area: string | null;
  eyebrow: string | null;
  neighborhoodTitle: string | null;
  description: string;
  displayOrder: number | null;
  updatedAt: string;
};

// Image slots the admin can override (friendly labels for the UI).
const IMAGE_SLOTS: { slot: string; label: string; page: string }[] = [
  { slot: 'home.hero', label: 'Foto de capa (hero)', page: 'Home' },
  { slot: 'home.block.chambers', label: 'Bloco Chambers', page: 'Home' },
  { slot: 'home.block.john-dalton-st', label: 'Bloco John Dalton St', page: 'Home' },
  { slot: 'home.block.wood-street', label: 'Bloco Wood Street', page: 'Home' },
  { slot: 'home.block.ancoats', label: 'Bloco Ancoats', page: 'Home' },
  { slot: 'home.block.old-trafford', label: 'Bloco Old Trafford', page: 'Home' },
  { slot: 'home.block.the-collective', label: 'Bloco The Collective', page: 'Home' },
  { slot: 'design.hero', label: 'Hero', page: 'Design Services' },
  { slot: 'design.approach', label: 'Seção "Our Approach"', page: 'Design Services' },
  { slot: 'design.before', label: 'Comparação — antes', page: 'Design Services' },
  { slot: 'design.after', label: 'Comparação — depois', page: 'Design Services' },
  { slot: 'management.hero', label: 'Hero', page: 'Management Services' },
  { slot: 'about.hero', label: 'Hero', page: 'About' },
];

// ── Shared primitives (Quiet Luxury) ────────────────────────────────
const label = 'font-body text-[10px] uppercase tracking-[0.15em] text-on-surface-variant block mb-1.5';
const field = 'w-full bg-transparent border-b border-outline-variant/50 py-1.5 font-body text-sm text-on-surface focus:outline-none focus:border-[#C5A059] transition-colors';

function Btn({ children, onClick, gold, disabled, type }: { children: ReactNode; onClick?: () => void; gold?: boolean; disabled?: boolean; type?: 'button' | 'submit' }) {
  const c = gold ? GOLD : '#101c2d';
  return (
    <button type={type || 'button'} onClick={onClick} disabled={disabled}
      className="px-6 py-2.5 rounded-lg font-body text-[11px] uppercase tracking-[0.15em] transition-colors disabled:opacity-40"
      style={{ border: `1px solid ${c}`, color: c, background: 'transparent' }}
      onMouseEnter={(e) => { if (!disabled) { e.currentTarget.style.background = c; e.currentTarget.style.color = '#fff'; } }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = c; }}>
      {children}
    </button>
  );
}

function Status({ s }: { s: 'idle' | 'saving' | 'saved' | 'error' }) {
  return (
    <span className="font-body text-[10px] uppercase tracking-[0.15em]" style={{ color: s === 'error' ? '#ba1a1a' : GOLD }}>
      {s === 'saving' && 'Salvando…'}{s === 'saved' && '✓ Salvo'}{s === 'error' && 'Erro'}
    </span>
  );
}

// ── Images tab ──────────────────────────────────────────────────────
function ImagesTab({ site, api, onImageChanged }: { site: SiteData; api: ReturnType<typeof useApi>; onImageChanged: (slot: string, url: string | null) => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const refs = useRef<Record<string, HTMLInputElement | null>>({});

  async function upload(slot: string, file: File) {
    setBusy(slot);
    setError(null);
    try {
      const { base64, type } = await fileToBase64(file);
      const res = await api(`/admin/images/${slot}`, { method: 'POST', body: JSON.stringify({ dataBase64: base64, contentType: type }) });
      onImageChanged(slot, res.url);
    } catch (err) {
      setError(`Imagem não enviada: ${(err as Error).message}`);
    } finally { setBusy(null); }
  }

  async function revert(slot: string) {
    setBusy(slot);
    setError(null);
    try {
      await api(`/admin/images/${slot}`, { method: 'DELETE' });
      onImageChanged(slot, null);
    } catch (err) {
      setError(`Não foi possível reverter: ${(err as Error).message}`);
    } finally { setBusy(null); }
  }

  return (
    <div className="max-w-3xl">
      <p className="font-body text-body-md text-on-surface-variant mb-8">Troque as imagens de capa das páginas. Sem uma imagem definida aqui, o site usa a imagem padrão.</p>
      {error && <p role="alert" className="mb-6 px-4 py-3 rounded-lg font-body text-sm" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>{error}</p>}
      <div className="divide-y divide-outline-variant/30 border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm">
        {IMAGE_SLOTS.map((s) => {
          const current = site.images[s.slot];
          return (
            <div key={s.slot} className="flex items-center gap-6 py-6">
              <div className="w-40 h-24 bg-surface-container shrink-0 overflow-hidden border border-outline-variant/30 flex items-center justify-center">
                {current ? <img src={current.url} alt="" className="w-full h-full object-cover" /> : <span className="font-body text-[10px] uppercase tracking-widest text-on-surface-variant/50">Padrão do site</span>}
              </div>
              <div className="flex-1">
                <div className="font-body text-[10px] uppercase tracking-[0.15em] text-on-surface-variant/70">{s.page}</div>
                <div className="font-display text-lg text-primary">{s.label}</div>
              </div>
              <div className="flex items-center gap-3">
                <Btn gold onClick={() => refs.current[s.slot]?.click()} disabled={busy === s.slot}>{busy === s.slot ? 'Enviando…' : current ? 'Trocar' : 'Enviar'}</Btn>
                {current && <Btn onClick={() => revert(s.slot)} disabled={busy === s.slot}>Reverter</Btn>}
                <input ref={(el) => { refs.current[s.slot] = el; }} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(s.slot, f); e.target.value = ''; }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Properties tab ──────────────────────────────────────────────────
type CanonicalPropertyField = 'name' | 'area' | 'eyebrow' | 'neighborhoodTitle' | 'description';

function PropertyField({
  property,
  propertyField,
  title,
  textarea,
  api,
  onChanged,
}: {
  property: AdminProperty;
  propertyField: CanonicalPropertyField;
  title: string;
  textarea?: boolean;
  api: ReturnType<typeof useApi>;
  onChanged: (property: AdminProperty) => void;
}) {
  const current = String(property[propertyField] ?? '');
  const [value, setValue] = useState(current);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    setValue(current);
  }, [current]);

  async function commit() {
    if (value === current) return;
    setStatus('saving');
    try {
      const response = await api(`/admin/properties/${encodeURIComponent(property.slug)}`, {
        method: 'PATCH',
        body: JSON.stringify({ [propertyField]: value }),
      });
      onChanged(response.property);
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 1500);
    } catch {
      setValue(current);
      setStatus('error');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between"><label className={label}>{title}</label><Status s={status} /></div>
      {textarea
        ? <textarea value={value} onChange={(e) => setValue(e.target.value)} onBlur={commit} rows={3} className={`${field} resize-none`} />
        : <input value={value} onChange={(e) => setValue(e.target.value)} onBlur={commit} className={field} />}
    </div>
  );
}

function PropertiesTab({
  properties,
  site,
  api,
  saveContent,
  onPropertyChanged,
}: {
  properties: AdminProperty[];
  site: SiteData;
  api: ReturnType<typeof useApi>;
  saveContent: SaveContent;
  onPropertyChanged: (property: AdminProperty) => void;
}) {
  const [open, setOpen] = useState<string>(properties[0]?.slug || '');

  useEffect(() => {
    if (!open && properties[0]) setOpen(properties[0].slug);
  }, [open, properties]);

  return (
    <div className="max-w-3xl">
      <p className="font-body text-body-md text-on-surface-variant mb-8">Edite o conteúdo de cada coleção. Clique no nome para expandir.</p>
      <div className="divide-y divide-outline-variant/30 border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm">
        {properties.map((property) => (
          <div key={property.slug}>
            <button type="button" onClick={() => setOpen(open === property.slug ? '' : property.slug)}
              className="w-full flex items-center justify-between py-5 text-left">
              <span className="flex items-baseline gap-3 min-w-0">
                <span className="font-display text-lg text-primary truncate">{property.name}</span>
                <span className="font-body text-[9px] uppercase tracking-[0.14em] text-on-surface-variant/50 shrink-0">{property.slug}</span>
              </span>
              <span className="font-body text-[10px] uppercase tracking-[0.12em] text-on-surface-variant/60">{open === property.slug ? '▲ fechar' : '▼ editar'}</span>
            </button>
            {open === property.slug && (
              <div className="grid gap-6 pb-8">
                <div className="grid grid-cols-2 gap-4">
                  <PropertyField property={property} propertyField="name" title="Nome" api={api} onChanged={onPropertyChanged} />
                  <PropertyField property={property} propertyField="area" title="Área / bairro" api={api} onChanged={onPropertyChanged} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <PropertyField property={property} propertyField="eyebrow" title="Sobretítulo (eyebrow)" api={api} onChanged={onPropertyChanged} />
                  <PropertyField property={property} propertyField="neighborhoodTitle" title="Título do bairro" api={api} onChanged={onPropertyChanged} />
                </div>
                <PropertyField property={property} propertyField="description" title="Descrição" textarea api={api} onChanged={onPropertyChanged} />
                <PropertyContentFields slug={property.slug} content={site.content} onSave={saveContent} />
                <UnitOrderEditor propertySlug={property.slug} api={api} />
                <PropertyGalleryEditor slug={property.slug} api={api} />
                <div className="border-t border-outline-variant/20 pt-5">
                  <p className={label}>Reviews da propriedade</p>
                  <p className="font-body text-xs text-on-surface-variant/60 mb-3">
                    Crie, edite, importe e publique reviews no workspace central de Reviews.
                  </p>
                  <Link
                    to={`/admin/reviews?property=${encodeURIComponent(property.slug)}`}
                    className="inline-flex items-center px-4 py-2 font-body text-[10px] uppercase tracking-[0.15em] border transition-colors"
                    style={{ borderColor: GOLD, color: GOLD }}
                  >
                    Gerir reviews desta propriedade →
                  </Link>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function UnitOrderEditor({ propertySlug, api }: { propertySlug: string; api: ReturnType<typeof useApi> }) {
  const [units, setUnits] = useState<{ unitSlug: string; unitName: string; displayTitle?: string | null; displayOrder: number }[]>([]);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const dragIdx = useRef<number | null>(null);

  const load = useCallback(async () => {
    const data = await api('/admin/units');
    const all: Unit[] = data.units || [];
    // Use the same sub-slug grouping as the collection page (e.g. 'chambers' → chambers-9, chambers-11)
    const inventoryUnitSlugs = new Set(getInventoryForProperty(propertySlug).map((u) => u.unitSlug));
    const filtered = all.filter((u) =>
      u.propertySlug === propertySlug || inventoryUnitSlugs.has(u.unitSlug)
    ).sort((a, b) => a.displayOrder - b.displayOrder);
    setUnits(filtered);
  }, [api, propertySlug]);

  useEffect(() => { load(); }, [load]);

  async function save(ordered: typeof units) {
    setStatus('saving');
    try {
      await api('/admin/units/reorder', { method: 'POST', body: JSON.stringify({ orderedSlugs: ordered.map((u) => u.unitSlug) }) });
      setStatus('saved'); setTimeout(() => setStatus('idle'), 1500);
    } catch { setStatus('error'); }
  }

  function onDragStart(i: number) { dragIdx.current = i; }
  function onDragOver(e: { preventDefault(): void }, i: number) {
    e.preventDefault();
    if (dragIdx.current === null || dragIdx.current === i) return;
    const next = [...units];
    const [moved] = next.splice(dragIdx.current, 1);
    next.splice(i, 0, moved);
    dragIdx.current = i;
    setUnits(next);
  }
  function onDrop() { if (dragIdx.current !== null) { save(units); dragIdx.current = null; } }

  if (units.length === 0) return null;
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className={label}>Ordem dos apartamentos</label>
        <Status s={status} />
      </div>
      <div className="space-y-1">
        {units.map((u, i) => (
          <div key={u.unitSlug} draggable
            onDragStart={() => onDragStart(i)}
            onDragOver={(e) => onDragOver(e, i)}
            onDrop={onDrop}
            className="flex items-center gap-3 px-3 py-2 cursor-grab select-none"
            style={{ border: '1px solid rgba(0,0,0,0.08)', background: '#fafaf8' }}>
            <span className="text-on-surface-variant/40 text-xs">⠿</span>
            <span className="font-body text-sm text-on-surface">{u.displayTitle?.trim() || u.unitName}</span>
            <span className="font-body text-[10px] text-on-surface-variant/50 ml-auto">{u.unitSlug}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PropertyGalleryEditor({ slug, api }: { slug: string; api: ReturnType<typeof useApi> }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [busy, setBusy] = useState(false);
  const [pendingKeys, setPendingKeys] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const owner = useMemo<MediaOwner>(() => ({ ownerType: 'property', ownerSlug: slug }), [slug]);
  const { uploadMedia, reorderMedia, patchMedia, deleteMedia } = useMediaMutations(api);

  const load = useCallback(async () => {
    const d = await api(`/admin/properties/${slug}/photos`);
    setPhotos(Array.isArray(d) ? d : []);
  }, [api, slug]);

  useEffect(() => { load(); }, [load]);

  const items = useMemo<MediaItem[]>(() => photos.map((photo) => ({
    ...photo,
    hidden: false,
  })), [photos]);

  function setPending(item: MediaItem, pending: boolean) {
    const key = getMediaKey(item);
    setPendingKeys((previous) => {
      const next = new Set(previous);
      if (pending) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  async function upload(file: File) {
    setBusy(true);
    setError('');
    try {
      await uploadMedia({ owner, file, alt: slug });
      await load();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Erro ao enviar foto');
    } finally {
      setBusy(false);
    }
  }

  async function move(item: MediaItem, dir: -1 | 1) {
    const ids = photos.map((p) => p.id);
    const from = item.id ? ids.indexOf(item.id) : -1;
    const to = from + dir;
    if (from === -1 || to < 0 || to >= ids.length) return;
    [ids[from], ids[to]] = [ids[to], ids[from]];
    const previous = photos;
    const byId = new Map(photos.map((photo) => [photo.id, photo]));
    setPhotos(ids.map((id) => byId.get(id)!).filter(Boolean));
    setPending(item, true);
    setError('');
    try {
      await reorderMedia({ owner, orderedIds: ids });
      await load();
    } catch (moveError) {
      setPhotos(previous);
      setError(moveError instanceof Error ? moveError.message : 'Erro ao guardar ordem');
    } finally {
      setPending(item, false);
    }
  }

  async function editAlt(item: MediaItem) {
    if (!item.id) return;
    const next = window.prompt('Alt text:', item.alt || '');
    if (next === null || next === (item.alt || '')) return;
    setPending(item, true);
    setError('');
    try {
      await patchMedia({ owner, mediaId: item.id, patch: { alt: next || null } });
      await load();
    } catch (patchError) {
      setError(patchError instanceof Error ? patchError.message : 'Erro ao guardar texto alternativo');
    } finally {
      setPending(item, false);
    }
  }

  async function setCover(item: MediaItem) {
    if (!item.id || item.isPrimary) return;
    setPending(item, true);
    setError('');
    try {
      await patchMedia({ owner, mediaId: item.id, patch: { isPrimary: true } });
      await load();
    } catch (patchError) {
      setError(patchError instanceof Error ? patchError.message : 'Erro ao definir capa');
    } finally {
      setPending(item, false);
    }
  }

  async function remove(item: MediaItem) {
    if (!item.id || !window.confirm('Excluir foto?')) return;
    setPending(item, true);
    setError('');
    try {
      await deleteMedia({ owner, mediaId: item.id });
      await load();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Erro ao excluir foto');
    } finally {
      setPending(item, false);
    }
  }

  return (
    <div>
      <label className={label}>Galeria da coleção</label>
      {error && <p className="font-body text-xs text-red-600 mt-2">{error}</p>}
      <div className="mt-2">
        <MediaGrid
          owner={owner}
          groups={[{ key: 'gallery', label: 'Fotos', items }]}
          pendingKeys={pendingKeys}
          renderUpload={() => (
            <label
              className={`aspect-[4/3] rounded-xl border-2 border-dashed border-outline-variant/40 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors hover:border-[#C5A059] ${busy ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <span className="text-xl" style={{ color: GOLD }}>＋</span>
              <span className="font-body text-[9px] uppercase tracking-widest text-on-surface-variant/60">
                {busy ? 'Enviando…' : 'Adicionar foto'}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) upload(file);
                  event.target.value = '';
                }}
              />
            </label>
          )}
          onMove={(_, item, _group, direction) => move(item, direction)}
          onSetPrimary={(_, item) => setCover(item)}
          onEditAlt={(_, item) => editAlt(item)}
          onDelete={(_, item) => remove(item)}
        />
      </div>
    </div>
  );
}

type ReviewRow = { id: string; propertySlug: string; name: string | null; date: string | null; text: string | null; rating: number; published: boolean; displayOrder: number; avatarUrl: string | null; sourceReviewId: string | null };

// ── Reviews tab (global, cross-apartment manager — Phase 16) ────────
// Review.propertySlug is used 1:1 as the owning unit's unitSlug in practice
// (see Phase 6/8 findings — the column name is misleading but every row is
// scoped to a single apartment, not a whole building), so "apartment filter"
// below just filters on that column directly.
// 5-star row matching the Stitch Reviews Management design: filled gold stars
// up to the (rounded) rating, outline gold stars for the remainder.
function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  const filled = Math.round(rating);
  return (
    <div className="flex text-gold" style={{ color: GOLD }} aria-label={`${rating} de 5 estrelas`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} size={size} fill={i < filled ? GOLD : 'none'} stroke={GOLD} strokeWidth={1.75} />
      ))}
    </div>
  );
}

function ReviewsTab({ units, api }: { units: Unit[]; api: ReturnType<typeof useApi> }) {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [unitFilter, setUnitFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'airbnb' | 'manual'>('all');
  const [visFilter, setVisFilter] = useState<'all' | 'published' | 'hidden'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'rating' | 'unit'>('date');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  // Confirm dialog state — replaces window.confirm() for both the
  // single-row remove and bulk-delete flows so screen readers get a
  // labelled, focus-trapped dialog instead of a blocking native prompt.
  const [confirmTarget, setConfirmTarget] = useState<{ kind: 'single'; id: string } | { kind: 'bulk' } | null>(null);
  const PAGE_SIZE = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try { const d = await api('/admin/reviews'); setReviews(Array.isArray(d) ? (d as ReviewRow[]) : []); }
    finally { setLoading(false); }
  }, [api]);

  useEffect(() => { load(); }, [load]);

  const unitName = (slug: string) => units.find((u) => u.unitSlug === slug)?.unitName || slug;

  const filtered = reviews
    .filter((r) => {
      const q = query.toLowerCase();
      return !q || (r.name || '').toLowerCase().includes(q) || (r.text || '').toLowerCase().includes(q);
    })
    .filter((r) => unitFilter === 'all' || r.propertySlug === unitFilter)
    .filter((r) => ratingFilter === 'all' || r.rating >= Number(ratingFilter))
    .filter((r) => sourceFilter === 'all' || (sourceFilter === 'airbnb' ? !!r.sourceReviewId : !r.sourceReviewId))
    .filter((r) => visFilter === 'all' || (visFilter === 'published' ? r.published : !r.published))
    .sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'unit') return unitName(a.propertySlug).localeCompare(unitName(b.propertySlug));
      // Best-effort only: `date` is free text (e.g. "Julho 2024"), not a real
      // timestamp, so this is a lexicographic sort, not a true chronological one.
      return (b.date || '').localeCompare(a.date || '');
    });

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pageCount);
  const pageReviews = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  async function update(id: string, patch: Partial<ReviewRow>) {
    await api(`/admin/reviews/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function remove(id: string) {
    await api(`/admin/reviews/${id}`, { method: 'DELETE' });
    setReviews((prev) => prev.filter((r) => r.id !== id));
    setSelected((prev) => { const next = new Set(prev); next.delete(id); return next; });
  }

  function toggleSelected(id: string) {
    setSelected((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }

  async function bulkSetPublished(published: boolean) {
    const ids = [...selected];
    await Promise.all(ids.map((id) => update(id, { published })));
    setSelected(new Set());
  }

  async function bulkDelete() {
    if (selected.size === 0) return;
    setConfirmTarget({ kind: 'bulk' });
  }

  async function confirmPendingDelete() {
    if (!confirmTarget) return;
    if (confirmTarget.kind === 'single') {
      await remove(confirmTarget.id);
    } else {
      const ids = [...selected];
      await Promise.all(ids.map((id) => api(`/admin/reviews/${id}`, { method: 'DELETE' })));
      setReviews((prev) => prev.filter((r) => !ids.includes(r.id)));
      setSelected(new Set());
    }
    setConfirmTarget(null);
  }

  const unitOptions: string[] = Array.from(new Set(reviews.map((r): string => r.propertySlug)));

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h2 className="font-display text-4xl font-bold text-navy mb-1">Reviews</h2>
          <p className="text-navy/60 font-body font-medium">
            {loading ? 'carregando…' : `${filtered.length} de ${reviews.length} review${reviews.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-navy/5 flex flex-wrap items-end gap-4 mb-6">
        <div className="flex-1 min-w-[200px] max-w-sm">
          <label className={label}>Buscar</label>
          <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Nome ou texto do review…" className={field} />
        </div>
        <div>
          <label className={label}>Apartamento</label>
          <select value={unitFilter} onChange={(e) => { setUnitFilter(e.target.value); setPage(1); }} className={`${field} min-w-[160px]`}>
            <option value="all">Todos</option>
            {unitOptions.map((slug) => <option key={slug} value={slug}>{unitName(slug)}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Nota mínima</label>
          <select value={ratingFilter} onChange={(e) => { setRatingFilter(e.target.value); setPage(1); }} className={field}>
            <option value="all">Todas</option>
            <option value="5">5</option>
            <option value="4">4+</option>
            <option value="3">3+</option>
          </select>
        </div>
        <div>
          <label className={label}>Origem</label>
          <select value={sourceFilter} onChange={(e) => { setSourceFilter(e.target.value as typeof sourceFilter); setPage(1); }} className={field}>
            <option value="all">Todas</option>
            <option value="airbnb">Importado do Airbnb</option>
            <option value="manual">Adicionado manualmente</option>
          </select>
        </div>
        <div>
          <label className={label}>Visibilidade</label>
          <select value={visFilter} onChange={(e) => { setVisFilter(e.target.value as typeof visFilter); setPage(1); }} className={field}>
            <option value="all">Todas</option>
            <option value="published">Publicados</option>
            <option value="hidden">Ocultos</option>
          </select>
        </div>
        <div>
          <label className={label}>Ordenar por</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className={field}>
            <option value="date">Data (texto)</option>
            <option value="rating">Nota</option>
            <option value="unit">Apartamento</option>
          </select>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="bg-navy text-white rounded-xl py-3 px-6 shadow-xl flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-navy font-bold w-6 h-6 flex items-center justify-center rounded-full text-xs" style={{ background: GOLD }}>{selected.size}</span>
            <span className="font-body text-sm">selecionado{selected.size !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => bulkSetPublished(true)} className="font-body text-xs font-bold px-4 py-1.5 rounded-lg" style={{ background: GOLD, color: NAVY }}>Publicar</button>
            <button onClick={() => bulkSetPublished(false)} className="font-body text-xs font-medium px-4 py-1.5 rounded-lg border border-white/30 hover:bg-white/10">Ocultar</button>
            <button onClick={bulkDelete} className="font-body text-xs font-medium px-4 py-1.5 rounded-lg text-red-400 hover:bg-red-500/20">Remover</button>
            <button onClick={() => setSelected(new Set())} className="font-body text-[10px] uppercase tracking-widest text-white/50 hover:text-white ml-2">Limpar</button>
          </div>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="bg-white border border-dashed border-navy/10 rounded-xl px-6 py-16 text-center">
          <p className="font-body text-sm text-navy/50">Nenhum review encontrado com estes filtros.</p>
        </div>
      )}

      {pageReviews.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-navy/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-navy/5 text-navy/40 uppercase text-[10px] tracking-widest font-bold">
                  <th className="py-4 px-4 w-10 text-center"><span className="sr-only">Selecionar</span></th>
                  <th className="py-4 px-4 min-w-[180px]">Hóspede</th>
                  <th className="py-4 px-4">Nota</th>
                  <th className="py-4 px-4 min-w-[130px]">Apartamento</th>
                  <th className="py-4 px-4 min-w-[280px]">Trecho</th>
                  <th className="py-4 px-4">Origem</th>
                  <th className="py-4 px-4">Data</th>
                  <th className="py-4 px-4">Visibilidade</th>
                  <th className="py-4 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/5">
                {pageReviews.map((r) => {
                  const isLong = (r.text || '').length > 280;
                  const isExpanded = expanded.has(r.id);
                  return (
                    <tr key={r.id} className={`hover:bg-cream/30 transition-colors group ${!r.published ? 'bg-navy/[0.02]' : ''}`}>
                      <td className="py-4 px-4 text-center">
                        <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelected(r.id)} className="rounded border-navy/20 accent-[#C5A059]" aria-label="Selecionar review" />
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {r.avatarUrl
                            ? <img src={r.avatarUrl} alt={r.name || ''} className="w-9 h-9 rounded-full object-cover shrink-0" />
                            : <div className="w-9 h-9 rounded-full bg-navy/5 flex items-center justify-center text-[10px] font-bold text-navy shrink-0">{(r.name || '?').slice(0, 2).toUpperCase()}</div>}
                          <span className="font-semibold text-sm text-navy">{r.name || 'Sem nome'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <StarRow rating={r.rating} />
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-navy/5 text-navy border border-navy/10">{unitName(r.propertySlug)}</span>
                      </td>
                      <td className="py-4 px-4 max-w-sm">
                        <p className={`text-sm text-navy/80 italic leading-relaxed ${!isExpanded && isLong ? 'line-clamp-2' : ''}`}>{r.text}</p>
                        {isLong && (
                          <button
                            onClick={() => setExpanded((prev) => { const next = new Set(prev); isExpanded ? next.delete(r.id) : next.add(r.id); return next; })}
                            className="font-body text-[10px] uppercase tracking-widest mt-1"
                            style={{ color: GOLD }}
                          >
                            {isExpanded ? 'Ver menos' : 'Ver mais'}
                          </button>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-xs font-medium text-navy/70">{r.sourceReviewId ? 'Airbnb' : 'Manual'}</span>
                      </td>
                      <td className="py-4 px-4"><span className="text-xs text-navy/60 font-medium">{r.date}</span></td>
                      <td className="py-4 px-4">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={r.published} onChange={() => update(r.id, { published: !r.published })} className="sr-only peer" aria-label="Publicado" />
                          <div className="w-9 h-5 bg-navy/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" style={r.published ? { background: GOLD } : undefined} />
                          <span className="ml-2 text-[10px] font-bold uppercase" style={{ color: r.published ? GOLD : undefined }}>{r.published ? 'Publicado' : 'Oculto'}</span>
                        </label>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button onClick={() => setConfirmTarget({ kind: 'single', id: r.id })} className="p-2 text-navy/40 hover:text-red-500 rounded-lg transition-colors" aria-label="Remover review">
                          <span className="font-body text-[10px] uppercase tracking-[0.12em]">Remover</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pageSafe === 1} className="font-body text-[11px] uppercase tracking-widest text-navy/50 disabled:opacity-30">← Anterior</button>
          <span className="font-body text-xs text-navy/50">Página {pageSafe} de {pageCount}</span>
          <button onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={pageSafe === pageCount} className="font-body text-[11px] uppercase tracking-widest text-navy/50 disabled:opacity-30">Próxima →</button>
        </div>
      )}

      <ConfirmDialog
        open={confirmTarget !== null}
        title={confirmTarget?.kind === 'bulk' ? 'Remover reviews' : 'Remover review'}
        message={
          confirmTarget?.kind === 'bulk'
            ? `Remover ${selected.size} review${selected.size !== 1 ? 's' : ''}? Esta ação não pode ser desfeita.`
            : 'Remover este review? Esta ação não pode ser desfeita.'
        }
        confirmLabel="Remover"
        onConfirm={confirmPendingDelete}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}

// ── Photos tab — per-apartment photo manager ─────────────────────────
// ── Dashboard ────────────────────────────────────────────────────────
function DashCard({ title, value, tone, onClick }: { title: string; value: string | number; tone?: 'warn' | 'default'; onClick?: () => void }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={`bg-white p-6 rounded-xl shadow-sm border border-navy/5 text-left w-full transition-all ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
    >
      <p className="text-navy/60 text-xs font-semibold uppercase tracking-widest mb-1.5 font-body">{title}</p>
      <h3 className="font-display text-4xl font-bold" style={{ color: tone === 'warn' && Number(value) > 0 ? '#ba1a1a' : NAVY }}>{value}</h3>
    </Tag>
  );
}

function DashboardTab({ units, onGoToApartments, onGoToPhotos }: {
  units: Unit[];
  onGoToApartments: (query: string) => void;
  onGoToPhotos: () => void;
}) {
  if (units.length === 0) {
    return <p className="font-body text-on-surface-variant/60">Nenhum apartamento cadastrado ainda.</p>;
  }

  const propertyCount = new Set(units.map((u) => u.propertySlug)).size;
  const visibleUnits = units.filter((u) => u.visible);
  const hiddenUnits = units.filter((u) => !u.visible);
  const noDescription = units.filter((u) => !u.description || !u.description.trim());
  const noPhotos = units.filter((u) => u.photos.length === 0);
  const uncategorisedPhotos = units.flatMap((u) => u.photos.filter((p) => !p.roomCategory));
  const brokenPhotos = units.flatMap((u) => u.photos.filter((p) => !p.url || !p.url.trim()));
  const recentlyUpdated = [...units]
    .filter((u) => u.updatedAt)
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
    .slice(0, 6);

  return (
    <div>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="font-display text-4xl font-bold text-navy">Dashboard</h2>
          <p className="text-navy/50 mt-1 font-body font-medium">Visão geral dos seus apartamentos e propriedades.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <DashCard title="Propriedades" value={propertyCount} />
        <DashCard title="Apartamentos" value={units.length} onClick={() => onGoToApartments('')} />
        <DashCard title="Visíveis" value={visibleUnits.length} onClick={() => onGoToApartments('')} />
        <DashCard title="Ocultos" value={hiddenUnits.length} tone={hiddenUnits.length > 0 ? 'warn' : 'default'} onClick={() => onGoToApartments('')} />
      </div>

      <div className="mb-10">
        <h3 className="font-display text-xl font-bold text-navy mb-4">Avisos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DashCard title="Sem descrição" value={noDescription.length} tone={noDescription.length > 0 ? 'warn' : 'default'} onClick={() => onGoToApartments('')} />
          <DashCard title="Sem fotos" value={noPhotos.length} tone={noPhotos.length > 0 ? 'warn' : 'default'} onClick={onGoToPhotos} />
          <DashCard title="Fotos sem categoria" value={uncategorisedPhotos.length} tone={uncategorisedPhotos.length > 0 ? 'warn' : 'default'} onClick={onGoToPhotos} />
          <DashCard title="Fotos com link quebrado" value={brokenPhotos.length} tone={brokenPhotos.length > 0 ? 'warn' : 'default'} onClick={onGoToPhotos} />
        </div>
        {noDescription.length > 0 && (
          <p className="font-body text-xs text-navy/50 mt-3">
            Sem descrição: {noDescription.slice(0, 8).map((u) => u.unitName).join(', ')}{noDescription.length > 8 ? '…' : ''}
          </p>
        )}
        {hiddenUnits.length > 0 && (
          <p className="font-body text-xs text-navy/50 mt-1">
            Ocultos: {hiddenUnits.slice(0, 8).map((u) => u.unitName).join(', ')}{hiddenUnits.length > 8 ? '…' : ''}
          </p>
        )}
      </div>

      {recentlyUpdated.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-navy/5 overflow-hidden">
          <div className="p-6 border-b border-navy/5">
            <h3 className="font-display text-xl font-bold text-navy">Atualizados recentemente</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-navy/5">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-navy/40">Apartamento</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-navy/40">Propriedade</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-navy/40">Atualizado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/5">
                {recentlyUpdated.map((u) => (
                  <tr key={u.unitSlug} className="hover:bg-cream/30 transition-colors">
                    <td className="px-6 py-4">
                      <Link to={`/admin/apartments/${u.unitSlug}`} className="text-sm font-semibold text-navy hover:underline">{u.unitName}</Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-navy/70">{u.propertyName}</td>
                    <td className="px-6 py-4 text-xs font-medium text-navy/40">
                      {u.updatedAt ? new Date(u.updatedAt).toLocaleDateString('pt-BR') : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function PhotosTab({ units, api, onChanged }: { units: Unit[]; api: ReturnType<typeof useApi>; onChanged: () => void | Promise<void> }) {
  const [selectedPropertySlug, setSelectedPropertySlug] = useState('');
  const [selectedUnitSlug, setSelectedUnitSlug] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState('');
  const [pendingKeys, setPendingKeys] = useState<Set<string>>(new Set());
  const [bulkCat, setBulkCat] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const owner = useMemo<MediaOwner>(
    () => ({ ownerType: 'unit', ownerSlug: selectedUnitSlug }),
    [selectedUnitSlug],
  );
  const { uploadMedia, reorderMedia, patchMedia, deleteMedia } = useMediaMutations(api);

  // Build ordered property list from loaded units
  const properties = useMemo(() => {
    const seen = new Map<string, string>();
    for (const u of units) if (!seen.has(u.propertySlug)) seen.set(u.propertySlug, u.propertyName);
    return [...seen.entries()].map(([slug, name]) => ({ slug, name }));
  }, [units]);

  const propertyUnits = useMemo(
    () => units.filter((u) => u.propertySlug === selectedPropertySlug),
    [units, selectedPropertySlug],
  );

  const currentUnit = units.find((u) => u.unitSlug === selectedUnitSlug);

  const sortedPhotos = useMemo<MediaItem[]>(
    () => [...(currentUnit?.photos || [])]
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((photo) => ({ ...photo, hidden: photo.hidden ?? false })),
    [currentUnit],
  );

  // Group sorted photos by roomCategory for display
  const groups = useMemo(() => {
    const map = new Map<string, MediaItem[]>();
    const order: string[] = [];
    for (const p of sortedPhotos) {
      const cat = p.roomCategory || '';
      if (!map.has(cat)) { map.set(cat, []); order.push(cat); }
      map.get(cat)!.push(p);
    }
    return order.map((cat) => ({ key: cat, label: cat || 'Sem categoria', items: map.get(cat)! }));
  }, [sortedPhotos]);

  const uncategorizedCount = sortedPhotos.filter((p) => !p.roomCategory).length;

  function setPending(item: MediaItem, pending: boolean) {
    const key = getMediaKey(item);
    setPendingKeys((previous) => {
      const next = new Set(previous);
      if (pending) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  function markSaved() {
    setStatus('saved');
    setTimeout(() => setStatus('idle'), 1200);
  }

  async function uploadPhoto(file: File) {
    if (!selectedUnitSlug || !currentUnit) return;
    setStatus('saving');
    setError('');
    try {
      await uploadMedia({ owner, file, alt: currentUnit.unitName });
      await Promise.resolve(onChanged());
      markSaved();
    } catch (uploadError) {
      setStatus('error');
      setError(uploadError instanceof Error ? uploadError.message : 'Erro ao enviar foto');
    }
  }

  async function moveCategoryPhoto(item: MediaItem, dir: -1 | 1, catKey: string) {
    if (!item.id) return;
    const catPhotos = sortedPhotos.filter((p) => (p.roomCategory || '') === catKey);
    const catIdx = catPhotos.findIndex((p) => p.id === item.id);
    const swapIdx = catIdx + dir;
    if (catIdx === -1 || swapIdx < 0 || swapIdx >= catPhotos.length) return;

    const ids = sortedPhotos.map((p) => p.id).filter((id): id is string => Boolean(id));
    const gA = ids.indexOf(item.id);
    const swapId = catPhotos[swapIdx].id;
    if (!swapId) return;
    const gB = ids.indexOf(swapId);
    [ids[gA], ids[gB]] = [ids[gB], ids[gA]];

    setStatus('saving');
    setError('');
    setPending(item, true);
    try {
      await reorderMedia({ owner, orderedIds: ids });
      await Promise.resolve(onChanged());
      markSaved();
    } catch (moveError) {
      setStatus('error');
      setError(moveError instanceof Error ? moveError.message : 'Erro ao guardar ordem');
    } finally {
      setPending(item, false);
    }
  }

  async function patchPhoto(item: MediaItem, patch: Parameters<typeof patchMedia>[0]['patch'], fallbackError: string) {
    if (!item.id) return;
    setStatus('saving');
    setError('');
    setPending(item, true);
    try {
      await patchMedia({ owner, mediaId: item.id, patch });
      await Promise.resolve(onChanged());
      markSaved();
    } catch (patchError) {
      setStatus('error');
      setError(patchError instanceof Error ? patchError.message : fallbackError);
    } finally {
      setPending(item, false);
    }
  }

  async function bulkSetCategory(items: MediaItem[], roomCategory: string | null) {
    const withIds = items.filter((item): item is MediaItem & { id: string } => Boolean(item.id));
    if (!withIds.length) return;
    setStatus('saving');
    setError('');
    withIds.forEach((item) => setPending(item, true));
    try {
      await Promise.all(withIds.map((item) => patchMedia({
        owner,
        mediaId: item.id,
        patch: { roomCategory },
      })));
      await Promise.resolve(onChanged());
      markSaved();
    } catch (bulkError) {
      setStatus('error');
      setError(bulkError instanceof Error ? bulkError.message : 'Erro ao guardar categorias');
    } finally {
      withIds.forEach((item) => setPending(item, false));
    }
  }

  async function editAlt(item: MediaItem) {
    const next = window.prompt('Alt text:', item.alt || '');
    if (next === null || next === (item.alt || '')) return;
    await patchPhoto(item, { alt: next || null }, 'Erro ao guardar texto alternativo');
  }

  async function removePhoto(item: MediaItem) {
    if (!item.id || !window.confirm(`Excluir esta foto${item.alt ? ` (${item.alt})` : ''}?`)) return;
    setStatus('saving');
    setError('');
    setPending(item, true);
    try {
      await deleteMedia({ owner, mediaId: item.id });
      await Promise.resolve(onChanged());
      markSaved();
    } catch (deleteError) {
      setStatus('error');
      setError(deleteError instanceof Error ? deleteError.message : 'Erro ao excluir foto');
    } finally {
      setPending(item, false);
    }
  }

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h2 className="font-display text-headline-md text-primary mb-1">Gestão de fotos</h2>
        <p className="font-body text-sm text-on-surface-variant">Selecione um edifício e apartamento. As fotos são separadas por divisão e aparecem assim no Photo Tour público.</p>
      </div>

      {/* Building + apartment selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className={label}>Edifício / coleção</label>
          <select
            value={selectedPropertySlug}
            onChange={(e) => { setSelectedPropertySlug(e.target.value); setSelectedUnitSlug(''); }}
            className={field}
          >
            <option value="">— selecione —</option>
            {properties.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Apartamento</label>
          <select
            value={selectedUnitSlug}
            onChange={(e) => setSelectedUnitSlug(e.target.value)}
            className={field}
            disabled={!selectedPropertySlug}
          >
            <option value="">— selecione —</option>
            {propertyUnits.map((u) => (
              <option key={u.unitSlug} value={u.unitSlug}>
                {u.unitName} ({u.photos.length} foto{u.photos.length !== 1 ? 's' : ''})
              </option>
            ))}
          </select>
        </div>
      </div>

      {!selectedPropertySlug && (
        <p className="font-body text-sm text-on-surface-variant/50">Selecione um edifício para continuar.</p>
      )}

      {selectedPropertySlug && !currentUnit && (
        <p className="font-body text-sm text-on-surface-variant">Selecione um apartamento para gerir as fotos.</p>
      )}

      {currentUnit && (
        <>
          {/* Unit info + upload */}
          <div className="flex items-start justify-between border-b border-outline-variant/30 pb-5 gap-4 flex-wrap">
            <div>
              <p className="font-display text-xl text-primary">{currentUnit.propertyName}</p>
              <p className="font-body text-sm text-on-surface-variant mt-0.5">
                {currentUnit.unitName} · {sortedPhotos.length} foto{sortedPhotos.length !== 1 ? 's' : ''}
              </p>
              {error && <p className="font-body text-xs text-red-600 mt-1">{error}</p>}
              {currentUnit.airbnbUrl && (
                <p className="font-body text-[10px] text-on-surface-variant/40 mt-1 truncate max-w-xs">{currentUnit.airbnbUrl}</p>
              )}
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <Status s={status} />
              <button
                onClick={() => fileRef.current?.click()}
                className="px-5 py-2 font-body text-[11px] uppercase tracking-[0.15em] border border-outline-variant/50 text-on-surface-variant hover:border-[#C5A059] hover:text-[#C5A059] transition-colors"
              >
                + Upload fotos
              </button>
              <input
                ref={fileRef} type="file" accept="image/*" multiple className="hidden"
                onChange={async (event) => {
                  for (const file of Array.from(event.currentTarget.files || []) as File[]) await uploadPhoto(file);
                  event.target.value = '';
                }}
              />
            </div>
          </div>

          {/* Uncategorised warning + bulk assign */}
          {uncategorizedCount > 0 && (
            <div className="flex items-center gap-4 flex-wrap px-4 py-3 rounded-lg border border-amber-200 bg-amber-50/60">
              <span className="font-body text-sm text-amber-700">
                ⚠ {uncategorizedCount} foto{uncategorizedCount !== 1 ? 's' : ''} sem categoria — no Photo Tour aparecerão todas juntas em "Property".
              </span>
              <div className="ml-auto flex items-center gap-2 shrink-0">
                <select
                  value={bulkCat}
                  onChange={(e) => setBulkCat(e.target.value)}
                  className="bg-transparent border-b border-amber-400 font-body text-xs text-amber-700 focus:outline-none"
                >
                  <option value="">Mover todas para…</option>
                  {ROOM_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                {bulkCat && (
                  <button
                    onClick={async () => {
                      await bulkSetCategory(sortedPhotos.filter((photo) => !photo.roomCategory), bulkCat);
                      setBulkCat('');
                    }}
                    className="font-body text-[10px] uppercase tracking-widest text-amber-700 hover:text-amber-900 underline"
                  >
                    Aplicar
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Empty state */}
          {sortedPhotos.length === 0 && (
            <div className="border border-dashed border-outline-variant/40 rounded-xl px-6 py-12 text-center">
              <p className="font-body text-sm text-on-surface-variant/60">
                Nenhuma foto. Clique em "+ Upload fotos" para começar.
              </p>
              <p className="font-body text-xs text-on-surface-variant/40 mt-2">
                As fotos do Airbnb só aparecem no Photo Tour após serem carregadas aqui.
              </p>
            </div>
          )}

          {/* Photos grouped by room category */}
          <MediaGrid
            owner={owner}
            groups={groups}
            categories={ROOM_CATEGORIES}
            pendingKeys={pendingKeys}
            onMove={(_, item, category, direction) => moveCategoryPhoto(item, direction, category)}
            onMoveToGroup={(_, item, category) => {
              if ((item.roomCategory || '') !== category) {
                patchPhoto(item, { roomCategory: category || null }, 'Erro ao guardar categoria');
              }
            }}
            onCategoryChange={(_, item, category) =>
              patchPhoto(item, { roomCategory: category || null }, 'Erro ao guardar categoria')}
            onToggleHidden={(_, item) =>
              patchPhoto(item, { hidden: !item.hidden }, 'Erro ao alterar visibilidade')}
            onSetPrimary={(_, item) =>
              patchPhoto(item, { isPrimary: true }, 'Erro ao definir capa')}
            onEditAlt={(_, item) => editAlt(item)}
            onDelete={(_, item) => removePhoto(item)}
          />
        </>
      )}
    </div>
  );
}

// ── Availability / iCal sync ────────────────────────────────────────
type AvailRow = {
  unitSlug: string; unitName: string; propertySlug: string; propertyName: string;
  hasIcal: boolean; lastSyncedAt: string | null; blockedCount: number;
};

function AvailabilityTab({ api }: { api: ReturnType<typeof useApi> }) {
  const [rows, setRows] = useState<AvailRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null); // 'all' | unitSlug | null

  async function load() {
    setLoading(true);
    const data = await api('/admin/availability');
    setRows(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function syncAll() {
    setSyncing('all');
    try { await api('/admin/sync', { method: 'POST' }); await load(); }
    finally { setSyncing(null); }
  }

  async function syncOne(unitSlug: string) {
    setSyncing(unitSlug);
    try { await api(`/admin/sync/${unitSlug}`, { method: 'POST' }); await load(); }
    finally { setSyncing(null); }
  }

  const fmt = (ts: string | null) => ts
    ? new Date(ts).toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'nunca';

  const groups: Record<string, AvailRow[]> = {};
  rows.forEach((r) => { (groups[r.propertyName] ||= []).push(r); });
  const withIcal = rows.filter((r) => r.hasIcal).length;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="font-body text-xs text-on-surface-variant">{withIcal}/{rows.length} com iCal configurado</span>
        <button onClick={syncAll} disabled={syncing !== null}
          className="ml-auto px-4 py-1.5 rounded-full font-body text-xs tracking-widest uppercase text-white transition-colors disabled:opacity-50"
          style={{ background: NAVY }}>
          {syncing === 'all' ? 'Sincronizando…' : 'Sincronizar tudo'}
        </button>
      </div>

      {loading ? (
        <p className="font-body text-sm text-on-surface-variant">Carregando…</p>
      ) : rows.length === 0 ? (
        <div className="border border-outline-variant/30 rounded-xl px-6 py-12 text-center">
          <p className="font-body text-sm text-on-surface-variant">Nenhuma unidade encontrada.</p>
        </div>
      ) : (
        Object.entries(groups).map(([propertyName, groupRows]) => (
          <div key={propertyName} className="space-y-3">
            <div className="flex items-center gap-4">
              <h2 className="font-display text-headline-sm text-primary whitespace-nowrap">{propertyName}</h2>
              <div className="flex-1 h-px" style={{ background: `${GOLD}55` }} />
            </div>
            {groupRows.map((r) => (
              <div key={r.unitSlug} className="border border-outline-variant/30 rounded-xl shadow-sm p-5 bg-surface-container-lowest flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-display text-headline-sm text-primary">{r.unitName}</p>
                  <div className="flex flex-wrap gap-3 font-body text-xs text-on-surface-variant mt-1">
                    <span className="px-2 py-0.5 rounded-full text-white" style={{ background: r.hasIcal ? '#3f7d5b' : '#9ca3af' }}>
                      {r.hasIcal ? 'iCal configurado' : 'sem iCal'}
                    </span>
                    <span className="bg-surface-dim px-2 py-0.5 rounded">{r.blockedCount} período(s) bloqueado(s)</span>
                    <span className="opacity-60">último sync: {fmt(r.lastSyncedAt)}</span>
                  </div>
                </div>
                <button onClick={() => syncOne(r.unitSlug)} disabled={!r.hasIcal || syncing !== null}
                  className="font-body text-[10px] tracking-widest uppercase px-3 py-1.5 border border-outline-variant/40 rounded hover:border-primary transition-colors text-on-surface-variant hover:text-primary disabled:opacity-40 disabled:hover:border-outline-variant/40 disabled:hover:text-on-surface-variant">
                  {syncing === r.unitSlug ? 'Sincronizando…' : 'Sincronizar'}
                </button>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}

// Airbnb review collector: self-contained tool served from /public, embedded
// here so its full parsing/CSV logic stays intact. Pre-populated with every
// project apartment (keyed by the Supabase Unit slug).
function CollectorTab() {
  return (
    <iframe src="/admin-review-collector.html" title="Coletor de avaliações Airbnb"
      className="w-full block" style={{ height: 'calc(100vh - 4rem)', border: 0, background: '#fcf9f4' }} />
  );
}

// ── Main ────────────────────────────────────────────────────────────
type Tab = 'dashboard' | 'apartments' | 'photos' | 'images' | 'content' | 'properties' | 'reviews' | 'leads' | 'availability' | 'collector';

function resolveAdminTab(queryValue: string | null): Tab {
  return getLegacyAdminTab(queryValue) ?? 'dashboard';
}

export default function Admin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token, logout } = useAdminAuth();
  const tab = resolveAdminTab(searchParams.get('tab'));
  const [units, setUnits] = useState<Unit[]>([]);
  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [site, setSite] = useState<SiteData>({ content: {}, images: {} });
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [propertyFilter, setPropertyFilter] = useState('all');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'visible' | 'hidden'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'property' | 'updated'>('property');
  const [page, setPage] = useState(1);
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const PAGE_SIZE = 24;

  const api = useApi(token, logout);

  const load = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    // Settle each request independently — if one endpoint fails (e.g. a missing
    // column on /admin/units), the other still loads so the whole panel doesn't
    // go blank. Each tab shows whatever data it could fetch.
    const [u, p, s] = await Promise.allSettled([
      api('/admin/units'),
      api('/admin/properties'),
      api('/admin/site'),
    ]);
    if (u.status === 'fulfilled' && Array.isArray(u.value?.units)) setUnits(u.value.units);
    if (p.status === 'fulfilled' && Array.isArray(p.value?.properties)) setProperties(p.value.properties);
    if (s.status === 'fulfilled' && s.value) setSite(s.value);
    if (showLoading) setLoading(false);
  }, [api]);

  useEffect(() => { load(); }, [load]);

  // Saves one content key and patches local state — no reload, so the screen
  // (and whatever the admin is typing in other fields) stays put.
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

  const propertyOptions = [...new Set(units.map((u) => u.propertySlug))]
    .map((slug) => ({ slug, name: units.find((u) => u.propertySlug === slug)?.propertyName || slug }));

  const filtered = units
    .filter((u) => {
      const q = query.toLowerCase();
      return !q || u.unitName.toLowerCase().includes(q) || u.propertyName.toLowerCase().includes(q) || u.unitSlug.includes(q);
    })
    .filter((u) => propertyFilter === 'all' || u.propertySlug === propertyFilter)
    .filter((u) => visibilityFilter === 'all' || (visibilityFilter === 'visible' ? u.visible : !u.visible))
    .sort((a, b) => {
      if (sortBy === 'name') return a.unitName.localeCompare(b.unitName);
      if (sortBy === 'updated') return (b.updatedAt || '').localeCompare(a.updatedAt || '');
      return a.propertyName.localeCompare(b.propertyName) || a.unitName.localeCompare(b.unitName);
    });

  // Client-side pagination: the full unit list is already fetched in one call
  // by `load()` (small dataset, tens not thousands of rows) — a server-side
  // paginated endpoint isn't warranted yet. Revisit if the unit count grows
  // enough that `GET /admin/units` itself becomes slow.
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pageCount);
  const pageUnits = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  const visibleCount = units.filter((u) => u.visible).length;
  const featured = Array.isArray(site.content['home.featured']) ? (site.content['home.featured'] as string[]) : [];
  const saveFeatured = (next: string[]) => saveContent('home.featured', next).catch(() => {});

  return (
    <AdminShell
      navItems={ADMIN_NAV_ITEMS}
      activeId={tab}
      breadcrumbs={[{ label: 'Admin' }]}
      rightSlot={
        <>
          <span className="font-body text-[10px] uppercase tracking-[0.12em] text-white/40">{visibleCount}/{units.length} visíveis</span>
          <button onClick={logout} className="font-body text-[10px] uppercase tracking-[0.15em] text-white/70 border border-white/25 px-4 py-1.5 hover:bg-white/10 transition-colors">Sair</button>
        </>
      }
    >
        {loading && <p className="font-body text-on-surface-variant">Carregando…</p>}

        {tab === 'dashboard' && !loading && (
          <DashboardTab
            units={units}
            onGoToApartments={() => navigate(getAdminNavPath('apartments'))}
            onGoToPhotos={() => navigate(getAdminNavPath('photos'))}
          />
        )}

        {tab === 'apartments' && !loading && (
          <>
            {/* Featured summary / counter */}
            <div className="mb-8 flex flex-wrap items-center gap-x-3 gap-y-1 border-l-2 pl-4 py-1" style={{ borderColor: GOLD }}>
              <span className="font-body text-[11px] uppercase tracking-[0.15em]" style={{ color: GOLD }}>
                ★ {featured.length} em destaque na home
              </span>
              {featured.length > 0 && (
                <span className="font-body text-[11px] text-on-surface-variant/70">
                  {featured.map((slug) => units.find((u) => u.unitSlug === slug)?.unitName || slug).join(' · ')}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-end gap-4 mb-10">
              <div className="flex-1 min-w-[220px] max-w-sm">
                <label className={label}>Buscar</label>
                <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Apartamento ou prédio…" className={field} />
              </div>
              <div>
                <label className={label}>Propriedade</label>
                <select value={propertyFilter} onChange={(e) => { setPropertyFilter(e.target.value); setPage(1); }} className={field}>
                  <option value="all">Todas</option>
                  {propertyOptions.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className={label}>Status</label>
                <select value={visibilityFilter} onChange={(e) => { setVisibilityFilter(e.target.value as typeof visibilityFilter); setPage(1); }} className={field}>
                  <option value="all">Todos</option>
                  <option value="visible">Visíveis</option>
                  <option value="hidden">Ocultos</option>
                </select>
              </div>
              <div>
                <label className={label}>Ordenar por</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className={field}>
                  <option value="property">Propriedade</option>
                  <option value="name">Nome</option>
                  <option value="updated">Atualizado recentemente</option>
                </select>
              </div>
              <span className="font-body text-[10px] uppercase tracking-widest text-on-surface-variant/50 pb-1.5">
                {filtered.length} resultado(s)
              </span>
            </div>
            {filtered.length === 0 && <p className="font-body text-on-surface-variant/60 mb-10">Nenhum apartamento encontrado.</p>}
            {pageUnits.length > 0 && (
              <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl overflow-hidden shadow-sm mb-6">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant/30">
                      <th className="w-10 py-3 px-4"><span className="sr-only">Selecionar</span></th>
                      <th className="w-16 py-3 px-4"><span className="sr-only">Foto</span></th>
                      <th className="py-3 px-4 font-body text-[10px] uppercase tracking-[0.15em] text-on-surface-variant/70">Nome</th>
                      <th className="py-3 px-4 font-body text-[10px] uppercase tracking-[0.15em] text-on-surface-variant/70">Grupo</th>
                      <th className="py-3 px-4 font-body text-[10px] uppercase tracking-[0.15em] text-on-surface-variant/70 text-center">Visibilidade</th>
                      <th className="py-3 px-4 font-body text-[10px] uppercase tracking-[0.15em] text-on-surface-variant/70 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageUnits.map((u) => {
                      const cover = u.photos.find((p) => p.isPrimary) || u.photos[0];
                      const isFeatured = featured.includes(u.unitSlug);
                      return (
                        <tr key={u.unitSlug} className="border-b border-outline-variant/15 last:border-b-0" style={{ opacity: u.visible ? 1 : 0.55 }}>
                          <td className="py-3 px-4">
                            <input type="checkbox" checked={selectedSlugs.includes(u.unitSlug)}
                              onChange={(e) => setSelectedSlugs((prev) => e.target.checked ? [...prev, u.unitSlug] : prev.filter((s) => s !== u.unitSlug))}
                              aria-label={`Selecionar ${u.unitName}`} className="w-4 h-4" />
                          </td>
                          <td className="py-3 px-4">
                            {cover ? (
                              <img src={cover.url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                            ) : (
                              <div className="w-12 h-12 rounded-lg border border-dashed border-outline-variant/50" />
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-body font-semibold text-sm text-on-surface">{u.unitName}</span>
                              {isFeatured && <span title="Em destaque na home" style={{ color: GOLD }}>★</span>}
                              {u.airbnbListed === false && (
                                <span title="A verificação diária detectou que este anúncio está 'não listado' no Airbnb, por isso ele não aparece no site. Volta automaticamente quando você reativar no Airbnb."
                                  className="font-body text-[9px] uppercase tracking-[0.12em] text-red-600 border border-red-300 px-1.5 py-0.5 rounded">
                                  Não listado no Airbnb
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-body text-sm text-on-surface-variant/70">{u.propertyName}</td>
                          <td className="py-3 px-4 text-center">
                            <button type="button" onClick={() => api(`/admin/units/${u.unitSlug}`, { method: 'PATCH', body: JSON.stringify({ visible: !u.visible }) }).then(() => load(false)).catch(() => {})}
                              aria-pressed={u.visible} aria-label={u.visible ? 'Ocultar apartamento' : 'Tornar apartamento visível'}
                              className="relative inline-block w-9 h-5 rounded-full transition-colors align-middle" style={{ background: u.visible ? GOLD : '#c5c6cd' }}>
                              <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: u.visible ? 18 : 2 }} />
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-3">
                              <a href={u.propertySlug ? `/properties/${u.propertySlug}/${u.unitSlug}` : `/property/${u.unitSlug}`}
                                target="_blank" rel="noopener noreferrer" title="Ver público"
                                className="font-body text-[10px] uppercase tracking-[0.15em] text-on-surface-variant/70 hover:text-[#C5A059] transition-colors">
                                Ver
                              </a>
                              <Link to={`/admin/apartments/${u.unitSlug}`} title="Editar"
                                className="font-body text-[10px] uppercase tracking-[0.15em] hover:text-[#C5A059] transition-colors" style={{ color: GOLD }}>
                                Editar
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {pageCount > 1 && (
              <div className="flex items-center justify-center gap-4 mt-6">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pageSafe <= 1}
                  className="font-body text-[10px] uppercase tracking-[0.15em] disabled:opacity-30" style={{ color: GOLD }}>
                  ← Anterior
                </button>
                <span className="font-body text-[10px] uppercase tracking-widest text-on-surface-variant/60">Página {pageSafe} de {pageCount}</span>
                <button onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={pageSafe >= pageCount}
                  className="font-body text-[10px] uppercase tracking-[0.15em] disabled:opacity-30" style={{ color: GOLD }}>
                  Próxima →
                </button>
              </div>
            )}
          </>
        )}

        {tab === 'photos' && !loading && <PhotosTab units={units} api={api} onChanged={() => load(false)} />}
        {tab === 'images' && !loading && <ImagesTab site={site} api={api} onImageChanged={onImageChanged} />}
        {tab === 'content' && !loading && <ContentEditor content={site.content} onSave={saveContent} />}
        {tab === 'properties' && !loading && (
          <PropertiesTab
            properties={properties}
            site={site}
            api={api}
            saveContent={saveContent}
            onPropertyChanged={(updated) => setProperties((current) =>
              current.map((property) => property.slug === updated.slug ? updated : property)
            )}
          />
        )}
        {tab === 'reviews' && !loading && <ReviewsTab units={units} api={api} />}
        {tab === 'availability' && !loading && <AvailabilityTab api={api} />}
        {tab === 'collector' && <CollectorTab />}
    </AdminShell>
  );
}
