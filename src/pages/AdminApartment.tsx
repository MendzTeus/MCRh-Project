import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ROOM_CATEGORIES } from '../components/PhotoTour';
import { getListingMedia } from '../data/listingMedia';

// ── Design tokens (must match Admin.tsx) ───────────────────────────
const GOLD = '#C5A059';
const NAVY = '#101c2d';
const TOKEN_KEY = 'mcrh_admin_token';
const lbl = 'font-body text-[10px] uppercase tracking-[0.15em] text-on-surface-variant block mb-1.5';
const fld = 'w-full bg-transparent border-b border-outline-variant/50 py-1.5 font-body text-sm text-on-surface focus:outline-none focus:border-[#C5A059] transition-colors';

// ── Types ───────────────────────────────────────────────────────────
type Photo = {
  id: string; url: string; alt: string | null; isPrimary: boolean;
  displayOrder: number; roomCategory: string | null;
};

type FullUnit = {
  unitSlug: string; unitName: string; propertySlug: string; propertyName: string;
  suppliedSpecs: string | null; postcode: string | null; airbnbUrl: string | null;
  description: string | null; squareFeet: number | null;
  icalAirbnbUrl: string | null; icalVrboUrl: string | null;
  visible: boolean; airbnbListed: boolean; displayOrder: number;
  // Extended columns (migration 002)
  maxGuests: number | null; bedrooms: number | null; beds: number | null;
  bathrooms: number | null; ensuiteBathrooms: number | null; wcCount: number | null;
  floor: number | null; hasLift: boolean | null;
  displayTitle: string | null; seoTitle: string | null; metaDescription: string | null;
  internalNotes: string | null; latitude: number | null; longitude: number | null;
  // Joined
  photos: Photo[]; reviewsCount: number; avgRating: number | null;
};

// ── Auth + API ──────────────────────────────────────────────────────
function useApi(token: string | null, onUnauthorized: () => void) {
  return useCallback(async (path: string, opts: RequestInit = {}) => {
    const res = await fetch(`/api${path}`, {
      ...opts,
      headers: { 'content-type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(opts.headers || {}) },
    });
    if (res.status === 401) { onUnauthorized(); throw new Error('Unauthorized'); }
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
    return res.json();
  }, [token, onUnauthorized]);
}

function fileToBase64(file: File): Promise<{ base64: string; type: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ base64: (reader.result as string).split(',')[1], type: file.type });
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo'));
    reader.readAsDataURL(file);
  });
}

// ── Shared UI ───────────────────────────────────────────────────────
function SaveStatus({ s }: { s: 'idle' | 'saving' | 'saved' | 'error' }) {
  if (s === 'idle') return null;
  return (
    <span className="font-body text-[10px] uppercase tracking-[0.15em]" style={{ color: s === 'error' ? '#ba1a1a' : GOLD }}>
      {s === 'saving' ? 'Salvando…' : s === 'saved' ? '✓ Salvo' : 'Erro ao salvar'}
    </span>
  );
}

function useAutosave(api: ReturnType<typeof useApi>, unitSlug: string) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const save = useCallback(async (patch: Record<string, unknown>) => {
    setStatus('saving');
    try {
      await api(`/admin/units/${unitSlug}`, { method: 'PATCH', body: JSON.stringify(patch) });
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 1500);
    } catch { setStatus('error'); }
  }, [api, unitSlug]);
  return { save, status };
}

// ── Dynamic room categories ─────────────────────────────────────────
function getDynamicCategories(unit: Pick<FullUnit, 'bedrooms' | 'bathrooms' | 'ensuiteBathrooms' | 'wcCount'> | null): string[] {
  const bedrooms = unit?.bedrooms || 0;
  const bathrooms = unit?.bathrooms || 0;
  const ensuite = unit?.ensuiteBathrooms || 0;
  const wc = unit?.wcCount || 0;

  const cats: string[] = ['Living room', 'Full kitchen', 'Kitchen', 'Dining area'];
  for (let i = 1; i <= bedrooms; i++) cats.push(`Bedroom ${i}`);
  if (bathrooms === 1) cats.push('Full bathroom');
  else for (let i = 1; i <= bathrooms; i++) cats.push(`Bathroom ${i}`);
  if (ensuite === 1) cats.push('Ensuite bathroom');
  else for (let i = 1; i <= ensuite; i++) cats.push(`Ensuite bathroom ${i}`);
  if (wc === 1) cats.push('WC');
  else for (let i = 1; i <= wc; i++) cats.push(`WC ${i}`);
  cats.push('Balcony', 'Terrace', 'Workspace', 'Entrance', 'Hallway', 'Exterior', 'Building', 'Shared areas', 'Other');
  return cats;
}

// ── Draggable photo tile ─────────────────────────────────────────────
type DragTileProps = {
  url: string; cat: string; index: number; total: number; isDragging: boolean;
  onDragStart: () => void; onDragEnd: () => void;
  onMoveLeft: () => void; onMoveRight: () => void; onRemove: () => void;
};
const DragTile: React.FC<DragTileProps> = ({
  url, cat, index, total, isDragging,
  onDragStart, onDragEnd, onMoveLeft, onMoveRight, onRemove,
}) => {
  const btn = 'flex-1 text-white/80 text-[11px] leading-none py-1 hover:text-[#C5A059] transition-colors disabled:opacity-25 disabled:hover:text-white/80';
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`relative shrink-0 overflow-hidden cursor-grab active:cursor-grabbing select-none transition-opacity ${isDragging ? 'opacity-30' : ''}`}
      style={{ width: 180, height: 135, border: '1px solid rgba(197,198,205,0.4)' }}
    >
      <img src={url} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" loading="lazy" />
      <div className="absolute bottom-0 left-0 right-0 flex" style={{ background: 'rgba(16,28,45,0.78)' }}>
        <button onClick={onMoveLeft} disabled={index === 0} className={btn}>◀</button>
        <button onClick={onMoveRight} disabled={index === total - 1} className={btn}>▶</button>
        {cat && <button onClick={onRemove} title="Remover da categoria" className={`${btn} hover:text-red-300`}>✕</button>}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TAB: Overview
// ══════════════════════════════════════════════════════════════════
function OverviewTab({ unit }: { unit: FullUnit }) {
  const publicUrl = unit.propertySlug
    ? `/properties/${unit.propertySlug}/${unit.unitSlug}`
    : `/property/${unit.unitSlug}`;

  const warnings: string[] = [];
  if (!unit.photos.some((p) => p.isPrimary) && unit.photos.length > 0) warnings.push('Sem foto de capa definida');
  const uncatPhotos = unit.photos.filter((p) => !p.roomCategory).length;
  if (uncatPhotos > 0) warnings.push(`${uncatPhotos} foto${uncatPhotos !== 1 ? 's' : ''} sem categoria no Photo Tour`);
  if (!unit.description) warnings.push('Sem descrição pública');
  if (!unit.postcode) warnings.push('Sem código postal');
  if (!unit.maxGuests) warnings.push('Capacidade máxima não definida (aba Divisões)');
  if (!unit.bedrooms) warnings.push('Número de quartos não definido (aba Divisões)');
  if (!unit.airbnbUrl) warnings.push('Sem link Airbnb configurado');

  const stat = (label: string, value: string | number | null | undefined) => (
    <div className="border border-outline-variant/20 rounded-lg p-4">
      <p className="font-body text-[10px] uppercase tracking-[0.12em] text-on-surface-variant/60 mb-1">{label}</p>
      <p className="font-display text-2xl text-primary">{value ?? '—'}</p>
    </div>
  );

  return (
    <div className="max-w-3xl space-y-8">
      {warnings.length > 0 && (
        <div className="border border-amber-200 bg-amber-50/60 rounded-lg p-4 space-y-2">
          <p className="font-body text-[11px] uppercase tracking-[0.12em] text-amber-700 font-semibold">⚠ Avisos</p>
          {warnings.map((w) => <p key={w} className="font-body text-sm text-amber-700">• {w}</p>)}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stat('Fotos', unit.photos.length)}
        {stat('Reviews', unit.reviewsCount)}
        {stat('Nota média', unit.avgRating ? unit.avgRating.toFixed(2) : null)}
        {stat('Hóspedes máx.', unit.maxGuests)}
        {stat('Quartos', unit.bedrooms)}
        {stat('Camas', unit.beds)}
        {stat('WC', unit.bathrooms)}
        {stat('Área', unit.squareFeet ? `${unit.squareFeet} ft²` : null)}
      </div>

      <div className="space-y-3 border border-outline-variant/20 rounded-lg p-5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-3 py-1 rounded-full font-body text-[10px] uppercase tracking-widest text-white"
            style={{ background: unit.visible ? '#3f7d5b' : '#6b7280' }}>
            {unit.visible ? '● Visível' : '○ Oculto'}
          </span>
          <span className="px-3 py-1 rounded-full font-body text-[10px] uppercase tracking-widest text-white"
            style={{ background: unit.airbnbListed ? '#3f7d5b' : '#ef4444' }}>
            Airbnb: {unit.airbnbListed ? 'Ativo' : 'Inativo'}
          </span>
        </div>
        <div className="grid gap-1.5 font-body text-sm text-on-surface-variant mt-2">
          <p>Slug: <code className="font-mono text-on-surface text-xs">{unit.unitSlug}</code></p>
          <p>Edifício: <span className="text-on-surface">{unit.propertyName}</span> <code className="font-mono text-xs">({unit.propertySlug})</code></p>
          {unit.postcode && <p>Código postal: <span className="text-on-surface">{unit.postcode}</span></p>}
          {unit.suppliedSpecs && <p>Specs: <span className="text-on-surface">{unit.suppliedSpecs}</span></p>}
          <p className="mt-1">
            Página pública:{' '}
            <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: GOLD }}>
              {publicUrl}
            </a>
          </p>
          {unit.airbnbUrl && (
            <p>
              Airbnb:{' '}
              <a href={unit.airbnbUrl} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: GOLD }}>
                {unit.airbnbUrl}
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TAB: Content
// ══════════════════════════════════════════════════════════════════
function ContentTab({ unit, api, onChanged }: { unit: FullUnit; api: ReturnType<typeof useApi>; onChanged: () => void }) {
  const { save, status } = useAutosave(api, unit.unitSlug);
  const [name, setName] = useState(unit.unitName);
  const [displayTitle, setDisplayTitle] = useState(unit.displayTitle || '');
  const [description, setDescription] = useState(unit.description || '');
  const [postcode, setPostcode] = useState(unit.postcode || '');
  const [squareFeet, setSquareFeet] = useState(unit.squareFeet != null ? String(unit.squareFeet) : '');

  useEffect(() => {
    setName(unit.unitName);
    setDisplayTitle(unit.displayTitle || '');
    setDescription(unit.description || '');
    setPostcode(unit.postcode || '');
    setSquareFeet(unit.squareFeet != null ? String(unit.squareFeet) : '');
  }, [unit.unitSlug]);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <p className="font-display text-headline-sm text-primary">Conteúdo</p>
        <SaveStatus s={status} />
      </div>

      <div>
        <label className={lbl}>Nome interno do apartamento</label>
        <input value={name} onChange={(e) => setName(e.target.value)}
          onBlur={() => name !== unit.unitName && save({ unitName: name })}
          className={fld} placeholder="Apartment 11.2" />
        <p className="font-body text-[10px] text-on-surface-variant/50 mt-1">Usado internamente e como fallback de título público.</p>
      </div>

      <div>
        <label className={lbl}>Título público (sobrescreve o nome automático)</label>
        <input value={displayTitle} onChange={(e) => setDisplayTitle(e.target.value)}
          onBlur={() => displayTitle !== (unit.displayTitle || '') && save({ displayTitle: displayTitle || null })}
          className={fld} placeholder="Deixe vazio para usar o nome automático" />
      </div>

      <div>
        <label className={lbl}>Descrição completa</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)}
          onBlur={() => description !== (unit.description || '') && save({ description: description || null })}
          className={`${fld} resize-none`} rows={7}
          placeholder="Descrição detalhada do apartamento, espaço, localização…" />
        <p className="font-body text-[10px] text-on-surface-variant/50 mt-1">{description.length} caracteres</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={lbl}>Código postal</label>
          <input value={postcode} onChange={(e) => setPostcode(e.target.value)}
            onBlur={() => postcode !== (unit.postcode || '') && save({ postcode: postcode || null })}
            className={fld} placeholder="M2 1HN" />
        </div>
        <div>
          <label className={lbl}>Área (sq ft)</label>
          <input type="number" min={0} value={squareFeet} onChange={(e) => setSquareFeet(e.target.value)}
            onBlur={() => {
              const v = squareFeet ? parseInt(squareFeet, 10) : null;
              if (v !== unit.squareFeet) save({ squareFeet: v });
            }}
            className={fld} placeholder="800" />
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TAB: Rooms & Capacity
// ══════════════════════════════════════════════════════════════════
function RoomsTab({ unit, api, onChanged }: { unit: FullUnit; api: ReturnType<typeof useApi>; onChanged: () => void }) {
  const { save, status } = useAutosave(api, unit.unitSlug);
  const [maxGuests, setMaxGuests] = useState(unit.maxGuests != null ? String(unit.maxGuests) : '');
  const [bedrooms, setBedrooms] = useState(unit.bedrooms != null ? String(unit.bedrooms) : '');
  const [beds, setBeds] = useState(unit.beds != null ? String(unit.beds) : '');
  const [bathrooms, setBathrooms] = useState(unit.bathrooms != null ? String(unit.bathrooms) : '');
  const [ensuite, setEnsuite] = useState(unit.ensuiteBathrooms != null ? String(unit.ensuiteBathrooms) : '');
  const [wc, setWc] = useState(unit.wcCount != null ? String(unit.wcCount) : '');
  const [floor, setFloor] = useState(unit.floor != null ? String(unit.floor) : '');
  const [hasLift, setHasLift] = useState(!!unit.hasLift);

  useEffect(() => {
    setMaxGuests(unit.maxGuests != null ? String(unit.maxGuests) : '');
    setBedrooms(unit.bedrooms != null ? String(unit.bedrooms) : '');
    setBeds(unit.beds != null ? String(unit.beds) : '');
    setBathrooms(unit.bathrooms != null ? String(unit.bathrooms) : '');
    setEnsuite(unit.ensuiteBathrooms != null ? String(unit.ensuiteBathrooms) : '');
    setWc(unit.wcCount != null ? String(unit.wcCount) : '');
    setFloor(unit.floor != null ? String(unit.floor) : '');
    setHasLift(!!unit.hasLift);
  }, [unit.unitSlug]);

  const n = (v: string) => (v !== '' ? parseInt(v, 10) : null);
  const nf = (v: string, u: number | null) => n(v) !== u;

  // Live preview of dynamic categories based on current field values
  const dynamicPreview = useMemo(() => getDynamicCategories({
    bedrooms: n(bedrooms), bathrooms: n(bathrooms),
    ensuiteBathrooms: n(ensuite), wcCount: n(wc),
  }), [bedrooms, bathrooms, ensuite, wc]);

  const numField = (lbText: string, val: string, set: (v: string) => void, onB: () => void) => (
    <div>
      <label className={lbl}>{lbText}</label>
      <input type="number" min={0} value={val} onChange={(e) => set(e.target.value)} onBlur={onB} className={fld} placeholder="0" />
    </div>
  );

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex items-center gap-4">
        <p className="font-display text-headline-sm text-primary">Divisões e capacidade</p>
        <SaveStatus s={status} />
      </div>
      <p className="font-body text-sm text-on-surface-variant -mt-4">
        Os valores aqui definem as categorias geradas automaticamente no Photo Tour.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
        {numField('Hóspedes máximos', maxGuests, setMaxGuests, () => nf(maxGuests, unit.maxGuests) && save({ maxGuests: n(maxGuests) }))}
        {numField('Quartos (bedrooms)', bedrooms, setBedrooms, () => nf(bedrooms, unit.bedrooms) && save({ bedrooms: n(bedrooms) }).then(onChanged))}
        {numField('Camas (beds)', beds, setBeds, () => nf(beds, unit.beds) && save({ beds: n(beds) }))}
        {numField('Casas de banho', bathrooms, setBathrooms, () => nf(bathrooms, unit.bathrooms) && save({ bathrooms: n(bathrooms) }).then(onChanged))}
        {numField('Ensuites', ensuite, setEnsuite, () => nf(ensuite, unit.ensuiteBathrooms) && save({ ensuiteBathrooms: n(ensuite) }).then(onChanged))}
        {numField('WCs', wc, setWc, () => nf(wc, unit.wcCount) && save({ wcCount: n(wc) }).then(onChanged))}
        {numField('Piso', floor, setFloor, () => nf(floor, unit.floor) && save({ floor: n(floor) }))}
      </div>

      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input type="checkbox" checked={hasLift}
          onChange={(e) => { setHasLift(e.target.checked); save({ hasLift: e.target.checked }); }}
          className="w-4 h-4 accent-[#C5A059]" />
        <span className="font-body text-sm text-on-surface">Edifício tem elevador</span>
      </label>

      <div className="border-t border-outline-variant/20 pt-6">
        <p className={`${lbl} mb-3`}>Categorias Photo Tour geradas automaticamente:</p>
        <div className="flex flex-wrap gap-1.5">
          {dynamicPreview.map((cat) => (
            <span key={cat} className="px-2.5 py-1 rounded font-body text-[10px] text-on-surface-variant border border-outline-variant/40">
              {cat}
            </span>
          ))}
        </div>
        <p className="font-body text-[10px] text-on-surface-variant/40 mt-3">
          As categorias dinâmicas (Bedroom 1, Bathroom 1, etc.) são geradas com base nos valores acima. Guarde os valores e recarregue para ver as categorias atualizadas.
        </p>
      </div>
    </div>
  );
}

// ── Pure helper: build category → url[] map from saved + Airbnb photos ─
function buildCategoryMap(
  savedPhotos: Photo[],
  airbnbUrls: string[],
  dynamicCats: string[],
): Record<string, string[]> {
  const cats: Record<string, string[]> = { '': [] };
  for (const cat of dynamicCats) cats[cat] = [];

  const savedSorted = [...savedPhotos].sort((a, b) => a.displayOrder - b.displayOrder);
  const savedUrls = new Set<string>();
  for (const p of savedSorted) {
    const cat = p.roomCategory || '';
    if (!cats[cat]) cats[cat] = [];
    cats[cat].push(p.url);
    savedUrls.add(p.url);
  }
  for (const url of airbnbUrls) {
    if (!savedUrls.has(url)) cats[''].push(url);
  }
  return cats;
}

// ══════════════════════════════════════════════════════════════════
// TAB: Photos — drag to categorise
// ══════════════════════════════════════════════════════════════════
function PhotosTabUnit({ unit, api, onChanged }: { unit: FullUnit; api: ReturnType<typeof useApi>; onChanged: () => void }) {
  const dynamicCats = useMemo(() => getDynamicCategories(unit), [unit.bedrooms, unit.bathrooms, unit.ensuiteBathrooms, unit.wcCount]);
  const airbnbUrls = useMemo(() => getListingMedia(unit.unitSlug)?.gallery || [], [unit.unitSlug]);

  // category → ordered url[] (local state; the source of truth while editing)
  const [catMap, setCatMap] = useState<Record<string, string[]>>(() =>
    buildCategoryMap(unit.photos, airbnbUrls, dynamicCats)
  );
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  // Re-init when saved photos reload (after onChanged)
  const stateKey = unit.unitSlug + '|' + unit.photos.map((p) => p.id + p.roomCategory + p.displayOrder).join(',');
  useEffect(() => {
    setCatMap(buildCategoryMap(unit.photos, airbnbUrls, dynamicCats));
    setDirty(false);
  }, [stateKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalPhotos = useMemo(() => (Object.values(catMap) as string[][]).reduce((s, arr) => s + arr.length, 0), [catMap]);
  const uncatCount = (catMap[''] as string[] | undefined)?.length ?? 0;

  // All category keys to render: '' first, then dynamic order, then any extras from saved photos
  const visibleCats = useMemo((): string[] => {
    const keys: string[] = ['', ...dynamicCats];
    for (const k of Object.keys(catMap)) if (!keys.includes(k)) keys.push(k);
    return keys.filter((k) => k === '' || ((catMap[k] as string[] | undefined)?.length ?? 0) > 0 || dynamicCats.includes(k));
  }, [catMap, dynamicCats]);

  function moveToCategory(url: string, toCat: string) {
    setCatMap((prev) => {
      const next: Record<string, string[]> = {};
      for (const [k, arr] of Object.entries(prev) as [string, string[]][]) next[k] = arr.filter((u) => u !== url);
      if (!next[toCat]) next[toCat] = [];
      next[toCat] = [...next[toCat], url];
      return next;
    });
    setDirty(true);
  }

  function moveWithin(url: string, cat: string, dir: -1 | 1) {
    setCatMap((prev) => {
      const arr = [...(prev[cat] || [])];
      const idx = arr.indexOf(url);
      const swap = idx + dir;
      if (idx === -1 || swap < 0 || swap >= arr.length) return prev;
      [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
      return { ...prev, [cat]: arr };
    });
    setDirty(true);
  }

  async function save() {
    setStatus('saving');
    const assignments: { url: string; roomCategory: string | null; displayOrder: number; alt: string }[] = [];
    for (const [cat, urls] of Object.entries(catMap) as [string, string[]][]) {
      urls.forEach((url, i) => assignments.push({ url, roomCategory: cat || null, displayOrder: i, alt: unit.unitName }));
    }
    try {
      await api(`/admin/units/${unit.unitSlug}/photos/references`, {
        method: 'POST', body: JSON.stringify({ assignments }),
      });
      setStatus('saved'); setDirty(false); setTimeout(() => setStatus('idle'), 1500);
      onChanged();
    } catch { setStatus('error'); }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="font-display text-headline-sm text-primary">Fotos</p>
          <p className="font-body text-xs text-on-surface-variant mt-0.5">
            {totalPhotos} foto{totalPhotos !== 1 ? 's' : ''} do Airbnb
            {airbnbUrls.length > 0 && ` · arraste para categorizar`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SaveStatus s={status} />
          <button
            onClick={save}
            disabled={!dirty}
            className="px-5 py-2 font-body text-[11px] uppercase tracking-[0.15em] text-white transition-all disabled:opacity-30"
            style={{ background: GOLD }}
          >
            Salvar
          </button>
        </div>
      </div>

      {uncatCount > 0 && (
        <div className="px-4 py-3 rounded-lg border border-amber-200 bg-amber-50/60">
          <span className="font-body text-sm text-amber-700">
            ⚠ {uncatCount} foto{uncatCount !== 1 ? 's' : ''} sem categoria — arraste para uma secção abaixo para categorizar
          </span>
        </div>
      )}

      {totalPhotos === 0 && (
        <div className="border border-dashed border-outline-variant/40 rounded-lg px-6 py-16 text-center">
          <p className="font-body text-sm text-on-surface-variant/60">Nenhuma foto encontrada.</p>
          <p className="font-body text-xs text-on-surface-variant/40 mt-2">
            Certifique-se de que o slug do apartamento corresponde ao scrape do Airbnb.
          </p>
        </div>
      )}

      {/* Category sections — each is a drop zone */}
      {visibleCats.map((cat: string) => {
        const catPhotos = (catMap[cat] as string[] | undefined) ?? [];
        const isOver = dragOver === cat;

        return (
          <div key={cat || '_uncat'}>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(cat); }}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(null); }}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(null);
                const url = e.dataTransfer.getData('text/plain');
                if (url && url !== '') moveToCategory(url, cat);
              }}
              className={`rounded-xl transition-all duration-150 ${
                isOver
                  ? 'ring-2 ring-primary/50 bg-primary/5'
                  : dragging
                    ? 'ring-1 ring-outline-variant/30 bg-surface-container/20'
                    : ''
              }`}
            >
              {/* Section header */}
              <div className="flex items-center gap-3 px-3 py-2.5">
                <h3
                  className="font-body text-[11px] uppercase tracking-[0.15em]"
                  style={{ color: cat ? NAVY : '#92400e' }}
                >
                  {cat || 'Sem categoria'}
                </h3>
                <span className="font-body text-[10px] text-on-surface-variant/50">
                  {catPhotos.length}
                </span>
                <div className="flex-1 h-px bg-outline-variant/20" />
                {dragging && (
                  <span className="font-body text-[9px] uppercase tracking-widest"
                    style={{ color: isOver ? GOLD : 'rgba(0,0,0,0.25)' }}>
                    {isOver ? '↓ Soltar aqui' : 'Soltar aqui ↓'}
                  </span>
                )}
              </div>

              {/* Photos row */}
              <div className="flex flex-wrap gap-3 px-3 pb-4 min-h-[40px]">
                {catPhotos.map((url, i) => (
                  <DragTile
                    key={url}
                    url={url}
                    cat={cat}
                    index={i}
                    total={catPhotos.length}
                    isDragging={dragging === url}
                    onDragStart={() => {
                      setDragging(url);
                    }}
                    onDragEnd={() => { setDragging(null); setDragOver(null); }}
                    onMoveLeft={() => moveWithin(url, cat, -1)}
                    onMoveRight={() => moveWithin(url, cat, 1)}
                    onRemove={() => moveToCategory(url, '')}
                  />
                ))}

                {catPhotos.length === 0 && (
                  <div className={`flex-1 h-16 rounded-lg flex items-center justify-center border border-dashed transition-colors ${
                    isOver ? 'border-primary/50' : 'border-outline-variant/25'
                  }`}>
                    <span className="font-body text-xs" style={{ color: isOver ? GOLD : 'rgba(0,0,0,0.2)' }}>
                      {isOver ? 'Soltar para adicionar' : 'Arraste fotos aqui'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TAB: Photo Tour (preview + category stats)
// ══════════════════════════════════════════════════════════════════
function PhotoTourTab({ unit }: { unit: FullUnit }) {
  const dynamicCats = useMemo(() => getDynamicCategories(unit), [unit.bedrooms, unit.bathrooms, unit.ensuiteBathrooms, unit.wcCount]);
  const sortedPhotos = useMemo(() => [...unit.photos].sort((a, b) => a.displayOrder - b.displayOrder), [unit.photos]);

  const catGroups = useMemo(() => {
    const map = new Map<string, Photo[]>();
    for (const p of sortedPhotos) {
      const cat = p.roomCategory || '';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(p);
    }
    // Order: dynamic first, then extras
    const ordered: [string, Photo[]][] = [];
    const seen = new Set<string>();
    for (const cat of dynamicCats) {
      if (map.has(cat)) { ordered.push([cat, map.get(cat)!]); seen.add(cat); }
    }
    for (const [cat, photos] of map.entries()) {
      if (!seen.has(cat)) ordered.push([cat, photos]);
    }
    return ordered;
  }, [sortedPhotos, dynamicCats]);

  const uncatCount = sortedPhotos.filter((p) => !p.roomCategory).length;
  const sectionCount = catGroups.filter(([cat]) => cat !== '').length;
  const catCount = sortedPhotos.filter((p) => p.roomCategory).length;

  return (
    <div className="space-y-8">
      <div>
        <p className="font-display text-headline-sm text-primary mb-1">Photo Tour — pré-visualização</p>
        <p className="font-body text-sm text-on-surface-variant">
          Como as fotos serão agrupadas no Photo Tour público. Para atribuir categorias, use a aba "Fotos".
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="border border-outline-variant/20 rounded-lg p-4 text-center">
          <p className="font-display text-3xl text-primary">{sectionCount}</p>
          <p className="font-body text-[10px] uppercase tracking-widest text-on-surface-variant/60 mt-1">Secções</p>
        </div>
        <div className="border border-outline-variant/20 rounded-lg p-4 text-center">
          <p className="font-display text-3xl text-primary">{catCount}</p>
          <p className="font-body text-[10px] uppercase tracking-widest text-on-surface-variant/60 mt-1">Fotos categorizadas</p>
        </div>
        <div className="rounded-lg p-4 text-center border"
          style={{ borderColor: uncatCount > 0 ? '#fbbf24' : '#e2e8f0' }}>
          <p className="font-display text-3xl" style={{ color: uncatCount > 0 ? '#d97706' : '#3f7d5b' }}>{uncatCount}</p>
          <p className="font-body text-[10px] uppercase tracking-widest text-on-surface-variant/60 mt-1">Sem categoria</p>
        </div>
      </div>

      {uncatCount > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-amber-200 bg-amber-50/60">
          <span className="font-body text-sm text-amber-700">
            ⚠ {uncatCount} foto{uncatCount !== 1 ? 's' : ''} sem categoria não aparecer{uncatCount !== 1 ? 'ão' : 'á'} no Photo Tour público.
            Classifique-as na aba "Fotos".
          </span>
        </div>
      )}

      {catGroups.length === 0 && (
        <p className="font-body text-sm text-on-surface-variant">Nenhuma foto carregada ainda.</p>
      )}

      {catGroups.map(([cat, photos]) => (
        <div key={cat || '_uncat'} className="space-y-3">
          <div className="flex items-center gap-3">
            <h3 className="font-body text-[11px] uppercase tracking-[0.15em]" style={{ color: cat ? NAVY : '#92400e' }}>
              {cat || 'Sem categoria (não publicado)'}
            </h3>
            <span className="font-body text-[10px] text-on-surface-variant/50">{photos.length} foto{photos.length !== 1 ? 's' : ''}</span>
            <div className="flex-1 h-px bg-outline-variant/20" />
          </div>
          <div className="flex flex-wrap gap-2">
            {photos.map((p) => (
              <div key={p.id} className="relative group">
                <img src={p.url} alt={p.alt || ''} className="w-20 h-20 object-cover rounded" />
                {p.isPrimary && (
                  <div className="absolute top-0.5 left-0.5 font-body text-[7px] uppercase tracking-widest text-white px-1 py-0.5 rounded"
                    style={{ background: GOLD }}>Capa</div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TAB: Reviews
// ══════════════════════════════════════════════════════════════════
type ReviewRow = {
  id: string; propertySlug: string; name: string | null; date: string | null;
  text: string | null; rating: number; published: boolean;
  displayOrder: number; avatarUrl: string | null; sourceReviewId: string | null;
};

function ReviewsTabUnit({ unit, api }: { unit: FullUnit; api: ReturnType<typeof useApi> }) {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api(`/admin/reviews?property=${unit.unitSlug}`);
      setReviews(Array.isArray(d) ? d : []);
    } finally { setLoading(false); }
  }, [api, unit.unitSlug]);

  useEffect(() => { load(); }, [load]);

  async function add() {
    await api('/admin/reviews', {
      method: 'POST',
      body: JSON.stringify({ propertySlug: unit.unitSlug, name: 'Nome', date: 'Mês AAAA', text: '', rating: 5, displayOrder: reviews.length + 1 }),
    });
    load();
  }

  async function update(id: string, patch: Partial<ReviewRow>) {
    await api(`/admin/reviews/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function remove(id: string) {
    if (!window.confirm('Remover este review?')) return;
    await api(`/admin/reviews/${id}`, { method: 'DELETE' });
    setReviews((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <p className="font-display text-headline-sm text-primary">Reviews</p>
        <span className="font-body text-xs text-on-surface-variant">
          {loading ? 'carregando…' : `${reviews.length} review${reviews.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      <div className="space-y-4">
        {reviews.map((r) => (
          <div key={r.id} className="border border-outline-variant/30 p-4 grid gap-3" style={{ opacity: r.published ? 1 : 0.55 }}>
            <div className="flex items-center gap-3 flex-wrap">
              <input value={r.name || ''} placeholder="Nome do hóspede" onChange={(e) => update(r.id, { name: e.target.value })} className={`${fld} flex-1 min-w-0`} />
              <input value={r.date || ''} placeholder="Mês AAAA" onChange={(e) => update(r.id, { date: e.target.value })} className={`${fld} w-28`} />
              <input type="number" value={r.rating} min={1} max={5} step={0.1} title="Nota"
                onChange={(e) => update(r.id, { rating: Number(e.target.value) })} className={`${fld} w-16`} />
            </div>
            <textarea value={r.text || ''} placeholder="Texto do review…" rows={3}
              onChange={(e) => update(r.id, { text: e.target.value })} className={`${fld} resize-none`} />
            <div className="flex items-center gap-3">
              {r.avatarUrl
                ? <img src={r.avatarUrl} alt={r.name || ''} className="w-9 h-9 rounded-full object-cover shrink-0" />
                : <div className="w-9 h-9 rounded-full bg-outline-variant/20 shrink-0" />}
              <input value={r.avatarUrl || ''} placeholder="URL do avatar"
                onChange={(e) => update(r.id, { avatarUrl: e.target.value })} className={`${fld} flex-1`} />
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => update(r.id, { published: !r.published })}
                className="font-body text-[10px] uppercase tracking-[0.12em] text-on-surface-variant/70">
                {r.published ? '● Publicado' : '○ Oculto'}
              </button>
              <button onClick={() => remove(r.id)} className="font-body text-[10px] uppercase tracking-[0.12em] text-red-500 ml-auto">
                Remover
              </button>
            </div>
          </div>
        ))}
        <button onClick={add} className="font-body text-[10px] uppercase tracking-[0.15em]" style={{ color: GOLD }}>
          + Adicionar review
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TAB: Booking
// ══════════════════════════════════════════════════════════════════
function BookingTab({ unit, api }: { unit: FullUnit; api: ReturnType<typeof useApi> }) {
  const { save, status } = useAutosave(api, unit.unitSlug);
  const [airbnbUrl, setAirbnbUrl] = useState(unit.airbnbUrl || '');
  const [icalAirbnb, setIcalAirbnb] = useState(unit.icalAirbnbUrl || '');
  const [icalVrbo, setIcalVrbo] = useState(unit.icalVrboUrl || '');

  useEffect(() => {
    setAirbnbUrl(unit.airbnbUrl || '');
    setIcalAirbnb(unit.icalAirbnbUrl || '');
    setIcalVrbo(unit.icalVrboUrl || '');
  }, [unit.unitSlug]);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <p className="font-display text-headline-sm text-primary">Reservas e calendário</p>
        <SaveStatus s={status} />
      </div>

      <div>
        <label className={lbl}>URL do listing no Airbnb</label>
        <input value={airbnbUrl} onChange={(e) => setAirbnbUrl(e.target.value)}
          onBlur={() => airbnbUrl !== (unit.airbnbUrl || '') && save({ airbnbUrl: airbnbUrl || null })}
          className={fld} placeholder="https://www.airbnb.com/h/…" />
      </div>

      <div>
        <label className={lbl}>iCal Airbnb (feed de calendário)</label>
        <input value={icalAirbnb} onChange={(e) => setIcalAirbnb(e.target.value)}
          onBlur={() => icalAirbnb !== (unit.icalAirbnbUrl || '') && save({ icalAirbnbUrl: icalAirbnb || null })}
          className={fld} placeholder="https://www.airbnb.co.uk/calendar/ical/…" />
      </div>

      <div>
        <label className={lbl}>iCal VRBO (feed de calendário)</label>
        <input value={icalVrbo} onChange={(e) => setIcalVrbo(e.target.value)}
          onBlur={() => icalVrbo !== (unit.icalVrboUrl || '') && save({ icalVrboUrl: icalVrbo || null })}
          className={fld} placeholder="https://www.vrbo.com/icalendar/…" />
      </div>

      <p className="font-body text-xs text-on-surface-variant/50 border-t border-outline-variant/20 pt-4">
        Os feeds iCal são sincronizados automaticamente para bloquear datas no calendário de disponibilidade.
        Use o separador "Disponibilidade" no admin principal para forçar sincronização manual.
      </p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TAB: Settings
// ══════════════════════════════════════════════════════════════════
function SettingsTab({ unit, api, onChanged }: { unit: FullUnit; api: ReturnType<typeof useApi>; onChanged: () => void }) {
  const { save, status } = useAutosave(api, unit.unitSlug);
  const [visible, setVisible] = useState(unit.visible);
  const [displayOrder, setDisplayOrder] = useState(String(unit.displayOrder));
  const [seoTitle, setSeoTitle] = useState(unit.seoTitle || '');
  const [metaDesc, setMetaDesc] = useState(unit.metaDescription || '');
  const [notes, setNotes] = useState(unit.internalNotes || '');
  const [lat, setLat] = useState(unit.latitude != null ? String(unit.latitude) : '');
  const [lng, setLng] = useState(unit.longitude != null ? String(unit.longitude) : '');

  useEffect(() => {
    setVisible(unit.visible);
    setDisplayOrder(String(unit.displayOrder));
    setSeoTitle(unit.seoTitle || '');
    setMetaDesc(unit.metaDescription || '');
    setNotes(unit.internalNotes || '');
    setLat(unit.latitude != null ? String(unit.latitude) : '');
    setLng(unit.longitude != null ? String(unit.longitude) : '');
  }, [unit.unitSlug]);

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex items-center gap-4">
        <p className="font-display text-headline-sm text-primary">Configurações</p>
        <SaveStatus s={status} />
      </div>

      {/* Visibility toggle */}
      <div className="border border-outline-variant/20 rounded-lg p-5 space-y-4">
        <p className={lbl}>Visibilidade pública</p>
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <button type="button"
            onClick={() => { const next = !visible; setVisible(next); save({ visible: next }).then(onChanged); }}
            className="relative inline-flex w-12 h-6 rounded-full transition-colors focus-visible:outline"
            style={{ background: visible ? GOLD : '#9ca3af' }}>
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${visible ? 'left-6' : 'left-0.5'}`} />
          </button>
          <span className="font-body text-sm text-on-surface">
            {visible ? 'Visível ao público' : 'Oculto ao público'}
          </span>
        </label>
        <p className="font-body text-xs text-on-surface-variant/50">
          Ocultar remove o apartamento de todas as páginas públicas. Ele continua acessível e editável no admin.
        </p>
      </div>

      <div>
        <label className={lbl}>Ordem de exibição</label>
        <input type="number" value={displayOrder} onChange={(e) => setDisplayOrder(e.target.value)}
          onBlur={() => parseInt(displayOrder, 10) !== unit.displayOrder && save({ displayOrder: parseInt(displayOrder, 10) || 0 }).then(onChanged)}
          className={`${fld} max-w-[120px]`} />
        <p className="font-body text-[10px] text-on-surface-variant/50 mt-1">Menor número → aparece primeiro.</p>
      </div>

      {/* SEO */}
      <div className="border-t border-outline-variant/20 pt-6 space-y-4">
        <p className="font-body text-[11px] uppercase tracking-[0.15em] text-on-surface-variant font-semibold">SEO</p>
        <div>
          <label className={lbl}>SEO title (tag &lt;title&gt;)</label>
          <input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)}
            onBlur={() => seoTitle !== (unit.seoTitle || '') && save({ seoTitle: seoTitle || null })}
            className={fld} placeholder="Apartment 11.2 — Manchester City Centre | MCRh" />
          <p className="font-body text-[10px] text-on-surface-variant/40 mt-1">{seoTitle.length}/60 caracteres recomendados</p>
        </div>
        <div>
          <label className={lbl}>Meta description</label>
          <textarea value={metaDesc} onChange={(e) => setMetaDesc(e.target.value)}
            onBlur={() => metaDesc !== (unit.metaDescription || '') && save({ metaDescription: metaDesc || null })}
            className={`${fld} resize-none`} rows={3}
            placeholder="Luxurious 2-bedroom apartment in the heart of Manchester…" />
          <p className="font-body text-[10px] text-on-surface-variant/40 mt-1">{metaDesc.length}/160 caracteres recomendados</p>
        </div>
      </div>

      {/* Coordinates */}
      <div className="border-t border-outline-variant/20 pt-6 space-y-4">
        <p className="font-body text-[11px] uppercase tracking-[0.15em] text-on-surface-variant font-semibold">Coordenadas GPS</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Latitude</label>
            <input type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)}
              onBlur={() => { const v = lat ? parseFloat(lat) : null; if (v !== unit.latitude) save({ latitude: v }); }}
              className={fld} placeholder="53.4794" />
          </div>
          <div>
            <label className={lbl}>Longitude</label>
            <input type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value)}
              onBlur={() => { const v = lng ? parseFloat(lng) : null; if (v !== unit.longitude) save({ longitude: v }); }}
              className={fld} placeholder="-2.2453" />
          </div>
        </div>
        <p className="font-body text-[10px] text-on-surface-variant/40">Use Google Maps para obter as coordenadas exatas.</p>
      </div>

      {/* Internal notes */}
      <div className="border-t border-outline-variant/20 pt-6 space-y-4">
        <p className="font-body text-[11px] uppercase tracking-[0.15em] text-on-surface-variant font-semibold">Notas internas</p>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
          onBlur={() => notes !== (unit.internalNotes || '') && save({ internalNotes: notes || null })}
          className={`${fld} resize-none`} rows={4}
          placeholder="Notas internas — não visíveis ao público…" />
      </div>

      {/* Info only */}
      <div className="border-t border-outline-variant/20 pt-6 space-y-2 text-on-surface-variant/50">
        <p className="font-body text-[10px] uppercase tracking-[0.12em] font-semibold">Informações (só leitura)</p>
        <p className="font-body text-xs">Slug: <code className="font-mono">{unit.unitSlug}</code></p>
        <p className="font-body text-xs">Edifício: <code className="font-mono">{unit.propertySlug}</code></p>
        <p className="font-body text-xs">
          Airbnb listado: <span style={{ color: unit.airbnbListed ? '#3f7d5b' : '#ef4444' }}>
            {unit.airbnbListed ? 'Sim' : 'Não (verificação automática diária)'}
          </span>
        </p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// Main page
// ══════════════════════════════════════════════════════════════════
type ApartmentTab = 'overview' | 'content' | 'rooms' | 'photos' | 'photo-tour' | 'reviews' | 'booking' | 'settings';

export default function AdminApartment() {
  const { unitSlug } = useParams<{ unitSlug: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get('tab') || 'overview') as ApartmentTab;
  const setTab = (t: ApartmentTab) => setSearchParams({ tab: t }, { replace: true });

  const token = localStorage.getItem(TOKEN_KEY);
  const api = useApi(token, () => navigate('/admin'));

  const [unit, setUnit] = useState<FullUnit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadUnit = useCallback(async () => {
    if (!unitSlug) return;
    setLoading(true);
    setError('');
    try {
      const data = await api(`/admin/units/${unitSlug}`);
      setUnit(data.unit as FullUnit);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Falha ao carregar apartamento');
    } finally { setLoading(false); }
  }, [api, unitSlug]);

  useEffect(() => {
    if (!token) { navigate('/admin'); return; }
    loadUnit();
  }, [token, unitSlug]);

  const tabs: { id: ApartmentTab; label: string }[] = [
    { id: 'overview', label: 'Resumo' },
    { id: 'content', label: 'Conteúdo' },
    { id: 'rooms', label: 'Divisões' },
    { id: 'photos', label: 'Fotos' },
    { id: 'photo-tour', label: 'Photo Tour' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'booking', label: 'Reservas' },
    { id: 'settings', label: 'Configurações' },
  ];

  const publicUrl = unit
    ? (unit.propertySlug ? `/properties/${unit.propertySlug}/${unit.unitSlug}` : `/property/${unit.unitSlug}`)
    : '#';

  return (
    <div className="min-h-screen bg-surface">
      {/* Sticky header */}
      <header className="sticky top-0 z-20 text-white" style={{ background: NAVY, borderBottom: `1px solid ${GOLD}66` }}>
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          <div className="flex items-center justify-between h-14 gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <button onClick={() => navigate('/admin')}
                className="shrink-0 font-body text-[11px] uppercase tracking-[0.12em] text-white/50 hover:text-white transition-colors">
                ← Admin
              </button>
              {unit && (
                <div className="min-w-0">
                  <p className="font-body text-[9px] uppercase tracking-widest text-white/40 leading-none">{unit.propertyName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="font-display text-base text-white truncate">{unit.unitName}</p>
                    <span className="shrink-0 px-2 py-0.5 rounded-full font-body text-[8px] uppercase tracking-widest text-white"
                      style={{ background: unit.visible ? '#3f7d5b' : '#6b7280' }}>
                      {unit.visible ? 'Visível' : 'Oculto'}
                    </span>
                  </div>
                </div>
              )}
            </div>
            {unit && (
              <a href={publicUrl} target="_blank" rel="noopener noreferrer"
                className="shrink-0 font-body text-[10px] uppercase tracking-[0.12em] text-white/50 hover:text-white border border-white/20 px-3 py-1.5 hover:bg-white/10 transition-colors rounded">
                Ver público →
              </a>
            )}
          </div>

          {/* Tab navigation */}
          <nav className="flex overflow-x-auto gap-0" style={{ scrollbarWidth: 'none' }}>
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="shrink-0 font-body text-[10px] uppercase tracking-[0.12em] px-4 py-3 border-b-2 transition-colors"
                style={{
                  color: tab === t.id ? GOLD : 'rgba(255,255,255,0.45)',
                  borderBottomColor: tab === t.id ? GOLD : 'transparent',
                }}>
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-[1280px] mx-auto px-4 md:px-10 py-10">
        {loading && <p className="font-body text-on-surface-variant">Carregando apartamento…</p>}
        {error && (
          <div className="border border-red-200 bg-red-50/60 rounded-lg p-4">
            <p className="font-body text-sm text-red-700">{error}</p>
            <button onClick={loadUnit} className="font-body text-[10px] uppercase tracking-widest text-red-600 underline mt-2">Tentar novamente</button>
          </div>
        )}

        {unit && !loading && (
          <>
            {tab === 'overview' && <OverviewTab unit={unit} />}
            {tab === 'content' && <ContentTab unit={unit} api={api} onChanged={loadUnit} />}
            {tab === 'rooms' && <RoomsTab unit={unit} api={api} onChanged={loadUnit} />}
            {tab === 'photos' && <PhotosTabUnit unit={unit} api={api} onChanged={loadUnit} />}
            {tab === 'photo-tour' && <PhotoTourTab unit={unit} />}
            {tab === 'reviews' && <ReviewsTabUnit unit={unit} api={api} />}
            {tab === 'booking' && <BookingTab unit={unit} api={api} />}
            {tab === 'settings' && <SettingsTab unit={unit} api={api} onChanged={loadUnit} />}
          </>
        )}
      </main>
    </div>
  );
}
