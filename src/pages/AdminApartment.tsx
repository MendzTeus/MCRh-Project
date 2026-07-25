import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ROOM_CATEGORIES } from '../components/PhotoTour';

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

// ── Photo tile (mirrors Admin.tsx) ──────────────────────────────────
function PhotoTile({ photo, onSetCover, onDelete, onMove, onEditAlt, canLeft, canRight }: {
  photo: Photo; onSetCover: () => void; onDelete: () => void;
  onMove: (dir: -1 | 1) => void; onEditAlt: () => void;
  canLeft: boolean; canRight: boolean;
}) {
  const btn = 'flex-1 text-white/80 text-[11px] leading-none py-1 hover:text-[#C5A059] transition-colors disabled:opacity-25 disabled:hover:text-white/80';
  return (
    <div className="relative w-24 h-24 overflow-hidden shrink-0" style={{ border: photo.isPrimary ? `2px solid ${GOLD}` : '1px solid rgba(197,198,205,0.5)' }}>
      <img src={photo.url} alt={photo.alt || ''} className="w-full h-full object-cover" />
      {photo.isPrimary && <div className="absolute top-0 left-0 font-body text-[8px] uppercase tracking-widest text-white px-1.5 py-0.5" style={{ background: GOLD }}>Capa</div>}
      {!photo.alt && <div title="Sem texto alternativo" className="absolute top-0 right-0 font-body text-[8px] uppercase tracking-widest text-white/90 px-1 py-0.5" style={{ background: '#ba1a1a' }}>alt</div>}
      <div className="absolute bottom-0 left-0 right-0 flex" style={{ background: 'rgba(16,28,45,0.78)' }}>
        <button title="Mover esquerda" onClick={() => onMove(-1)} disabled={!canLeft} className={btn}>◀</button>
        <button title="Mover direita" onClick={() => onMove(1)} disabled={!canRight} className={btn}>▶</button>
        <button title="Definir como capa" onClick={onSetCover} disabled={photo.isPrimary} className={btn} style={{ color: photo.isPrimary ? GOLD : undefined }}>★</button>
        <button title="Editar alt text" onClick={onEditAlt} className={btn}>✎</button>
        <button title="Excluir" onClick={onDelete} className={`${btn} hover:text-red-300`}>✕</button>
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

// ══════════════════════════════════════════════════════════════════
// TAB: Photos
// ══════════════════════════════════════════════════════════════════
function PhotosTabUnit({ unit, api, onChanged }: { unit: FullUnit; api: ReturnType<typeof useApi>; onChanged: () => void }) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [bulkCat, setBulkCat] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const dynamicCats = useMemo(() => getDynamicCategories(unit), [unit.bedrooms, unit.bathrooms, unit.ensuiteBathrooms, unit.wcCount]);

  const sortedPhotos = useMemo(
    () => [...unit.photos].sort((a, b) => a.displayOrder - b.displayOrder),
    [unit.photos],
  );

  const groups = useMemo(() => {
    const map = new Map<string, Photo[]>();
    const order: string[] = [];
    for (const p of sortedPhotos) {
      const cat = p.roomCategory || '';
      if (!map.has(cat)) { map.set(cat, []); order.push(cat); }
      map.get(cat)!.push(p);
    }
    return order.map((cat) => ({ cat, photos: map.get(cat)! }));
  }, [sortedPhotos]);

  const uncategorizedCount = sortedPhotos.filter((p) => !p.roomCategory).length;

  async function uploadPhoto(file: File) {
    const { base64, type } = await fileToBase64(file);
    try {
      await api(`/admin/units/${unit.unitSlug}/photos`, {
        method: 'POST',
        body: JSON.stringify({ dataBase64: base64, contentType: type, alt: unit.unitName }),
      });
      onChanged();
    } catch { setStatus('error'); }
  }

  async function moveCategoryPhoto(id: string, dir: -1 | 1, catKey: string) {
    const catPhotos = sortedPhotos.filter((p) => (p.roomCategory || '') === catKey);
    const catIdx = catPhotos.findIndex((p) => p.id === id);
    const swapIdx = catIdx + dir;
    if (catIdx === -1 || swapIdx < 0 || swapIdx >= catPhotos.length) return;
    const ids = sortedPhotos.map((p) => p.id);
    const gA = ids.indexOf(id);
    const gB = ids.indexOf(catPhotos[swapIdx].id);
    [ids[gA], ids[gB]] = [ids[gB], ids[gA]];
    setStatus('saving');
    try {
      await api(`/admin/units/${unit.unitSlug}/photos/reorder`, { method: 'POST', body: JSON.stringify({ orderedIds: ids }) });
      setStatus('saved'); setTimeout(() => setStatus('idle'), 1200); onChanged();
    } catch { setStatus('error'); }
  }

  async function setCategory(id: string, roomCategory: string | null) {
    setStatus('saving');
    try {
      await api(`/admin/photos/${id}`, { method: 'PATCH', body: JSON.stringify({ roomCategory }) });
      setStatus('saved'); setTimeout(() => setStatus('idle'), 1200); onChanged();
    } catch { setStatus('error'); }
  }

  async function bulkSetCategory(ids: string[], roomCategory: string | null) {
    if (!ids.length) return;
    setStatus('saving');
    try {
      await Promise.all(ids.map((id) => api(`/admin/photos/${id}`, { method: 'PATCH', body: JSON.stringify({ roomCategory }) })));
      setStatus('saved'); setTimeout(() => setStatus('idle'), 1200); onChanged();
    } catch { setStatus('error'); }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="font-display text-headline-sm text-primary">Fotos</p>
          <p className="font-body text-xs text-on-surface-variant mt-0.5">
            {sortedPhotos.length} foto{sortedPhotos.length !== 1 ? 's' : ''} · somente deste apartamento
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <SaveStatus s={status} />
          <button onClick={() => fileRef.current?.click()}
            className="px-5 py-2 font-body text-[11px] uppercase tracking-[0.15em] border border-outline-variant/50 text-on-surface-variant hover:border-[#C5A059] hover:text-[#C5A059] transition-colors">
            + Upload fotos
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => { Array.from(e.target.files || []).forEach((f) => uploadPhoto(f as File)); e.target.value = ''; }} />
        </div>
      </div>

      {uncategorizedCount > 0 && (
        <div className="flex items-center gap-4 flex-wrap px-4 py-3 rounded-lg border border-amber-200 bg-amber-50/60">
          <span className="font-body text-sm text-amber-700">
            ⚠ {uncategorizedCount} foto{uncategorizedCount !== 1 ? 's' : ''} sem categoria
          </span>
          <div className="ml-auto flex items-center gap-2 shrink-0">
            <select value={bulkCat} onChange={(e) => setBulkCat(e.target.value)}
              className="bg-transparent border-b border-amber-400 font-body text-xs text-amber-700 focus:outline-none">
              <option value="">Mover todas para…</option>
              {dynamicCats.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {bulkCat && (
              <button onClick={async () => {
                const ids = sortedPhotos.filter((p) => !p.roomCategory).map((p) => p.id);
                await bulkSetCategory(ids, bulkCat);
                setBulkCat('');
              }} className="font-body text-[10px] uppercase tracking-widest text-amber-700 underline">
                Aplicar
              </button>
            )}
          </div>
        </div>
      )}

      {sortedPhotos.length === 0 && (
        <div className="border border-dashed border-outline-variant/40 rounded-lg px-6 py-16 text-center">
          <p className="font-body text-sm text-on-surface-variant/60">Nenhuma foto. Clique em "+ Upload fotos" para começar.</p>
          <p className="font-body text-xs text-on-surface-variant/40 mt-2">As fotos são vinculadas exclusivamente a este apartamento.</p>
        </div>
      )}

      {groups.map(({ cat, photos: catPhotos }) => (
        <div key={cat || '_uncategorized'} className="space-y-3">
          <div className="flex items-center gap-3">
            <h3 className="font-body text-[11px] uppercase tracking-[0.15em]" style={{ color: cat ? NAVY : '#92400e' }}>
              {cat || 'Sem categoria'}
            </h3>
            <span className="font-body text-[10px] text-on-surface-variant/50">
              {catPhotos.length} foto{catPhotos.length !== 1 ? 's' : ''}
            </span>
            <div className="flex-1 h-px bg-outline-variant/20" />
          </div>
          <div className="flex flex-wrap gap-3 items-start">
            {catPhotos.map((p, i) => (
              <div key={p.id} className="flex flex-col items-center gap-1.5">
                <PhotoTile photo={p}
                  canLeft={i > 0} canRight={i < catPhotos.length - 1}
                  onMove={(dir) => moveCategoryPhoto(p.id, dir, cat)}
                  onEditAlt={() => {
                    const next = window.prompt('Alt text:', p.alt || '');
                    if (next !== null) api(`/admin/photos/${p.id}`, { method: 'PATCH', body: JSON.stringify({ alt: next }) }).then(onChanged).catch(() => {});
                  }}
                  onSetCover={() => api(`/admin/photos/${p.id}`, { method: 'PATCH', body: JSON.stringify({ isPrimary: true }) }).then(onChanged).catch(() => {})}
                  onDelete={() => {
                    if (confirm('Excluir esta foto?')) api(`/admin/photos/${p.id}`, { method: 'DELETE' }).then(onChanged).catch(() => {});
                  }}
                />
                <select value={p.roomCategory || ''} onChange={(e) => setCategory(p.id, e.target.value || null)}
                  className="w-24 bg-transparent border-b border-outline-variant/40 font-body text-[9px] text-on-surface-variant focus:outline-none focus:border-[#C5A059] transition-colors py-0.5"
                  title="Categoria da divisão">
                  <option value="">— categoria —</option>
                  {dynamicCats.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
      ))}
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
