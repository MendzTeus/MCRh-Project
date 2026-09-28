import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { cleanListingTitle, getListingMedia } from '../data/listingMedia';
import { useApi, useUnsavedChangesGuard } from '../hooks/useAdminApi';
import { AdminShell } from '../components/admin/AdminShell';
import { ADMIN_NAV_ITEMS } from '../components/admin/adminNavigation';
import { useAdminAuth } from '../components/admin/AdminAuthContext';
import { UnitMediaWorkspace, UnitPhotoTourPreview } from '../components/admin/media';

// ── Design tokens (same as the rest of the admin) ───────────────────────────
const GOLD = '#C5A059';
const NAVY = '#101c2d';
const lbl = 'font-body text-[10px] uppercase tracking-[0.15em] text-on-surface-variant block mb-1.5';
const fld = 'w-full bg-transparent border-b border-outline-variant/50 py-1.5 font-body text-sm text-on-surface focus:outline-none focus:border-[#C5A059] transition-colors';

function moveFeaturedSlug(slugs: string[], unitSlug: string, toIndex: number): string[] {
  const fromIndex = slugs.indexOf(unitSlug);
  if (fromIndex === -1) return slugs;
  const next = [...slugs];
  next.splice(fromIndex, 1);
  next.splice(Math.max(0, Math.min(next.length, toIndex)), 0, unitSlug);
  return next;
}

// ── Types ───────────────────────────────────────────────────────────
type Photo = {
  id: string; url: string; alt: string | null; isPrimary: boolean;
  displayOrder: number; roomCategory: string | null; hidden: boolean;
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
  updatedAt?: string;
  // Joined
  photos: Photo[]; reviewsCount: number; avgRating: number | null;
};

// ── Shared UI ───────────────────────────────────────────────────────
function SaveStatus({ s, error }: { s: 'idle' | 'saving' | 'saved' | 'error'; error?: string }) {
  if (s === 'idle') return null;
  return (
    <span className="font-body text-[10px] uppercase tracking-[0.15em]" style={{ color: s === 'error' ? '#ba1a1a' : GOLD }}
      title={s === 'error' && error ? error : undefined}>
      {s === 'saving' ? 'Salvando…' : s === 'saved' ? '✓ Salvo' : `Erro: ${error || 'ao salvar'}`}
    </span>
  );
}

function useAutosave(api: ReturnType<typeof useApi>, unitSlug: string) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastError, setLastError] = useState('');
  const save = useCallback(async (patch: Record<string, unknown>) => {
    setStatus('saving');
    setLastError('');
    try {
      await api(`/admin/units/${unitSlug}`, { method: 'PATCH', body: JSON.stringify(patch) });
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 1500);
      return true;
    } catch (e) {
      setStatus('error');
      setLastError(e instanceof Error ? e.message : String(e));
      return false;
    }
  }, [api, unitSlug]);
  return { save, status, lastError };
}

// ── Dynamic room categories ─────────────────────────────────────────
function getDynamicCategories(unit: Pick<FullUnit, 'bedrooms' | 'bathrooms' | 'ensuiteBathrooms' | 'wcCount'> | null): string[] {
  const bedrooms = unit?.bedrooms ?? 3;
  const bathrooms = unit?.bathrooms ?? 1;
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
  if (!unit.maxGuests) warnings.push('Capacidade máxima não definida (aba Cômodos)');
  if (!unit.bedrooms) warnings.push('Número de quartos não definido (aba Cômodos)');
  if (!unit.airbnbUrl) warnings.push('Sem link Airbnb configurado');

  const stat = (label: string, value: string | number | null | undefined) => (
    <div className="border border-outline-variant/20 rounded-xl shadow-sm p-4">
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
        {stat('Avaliações', unit.reviewsCount)}
        {stat('Nota média', unit.avgRating ? unit.avgRating.toFixed(2) : null)}
        {stat('Hóspedes máx.', unit.maxGuests)}
        {stat('Quartos', unit.bedrooms)}
        {stat('Camas', unit.beds)}
        {stat('WC', unit.bathrooms)}
        {stat('Área', unit.squareFeet ? `${unit.squareFeet} ft²` : null)}
      </div>

      <div className="space-y-3 border border-outline-variant/20 rounded-xl shadow-sm p-5">
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
          <p>Prédio: <span className="text-on-surface">{unit.propertyName}</span> <code className="font-mono text-xs">({unit.propertySlug})</code></p>
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
  const { save, status, lastError } = useAutosave(api, unit.unitSlug);
  const originalAirbnbTitle = getListingMedia(unit.unitSlug)?.title || unit.unitName;
  const [name, setName] = useState(unit.unitName);
  const [displayTitle, setDisplayTitle] = useState(unit.displayTitle || '');
  const [suppliedSpecs, setSuppliedSpecs] = useState(unit.suppliedSpecs || '');
  const [description, setDescription] = useState(unit.description || '');
  const [postcode, setPostcode] = useState(unit.postcode || '');
  const [squareFeet, setSquareFeet] = useState(unit.squareFeet != null ? String(unit.squareFeet) : '');

  useEffect(() => {
    setName(unit.unitName);
    setDisplayTitle(unit.displayTitle || '');
    setSuppliedSpecs(unit.suppliedSpecs || '');
    setDescription(unit.description || '');
    setPostcode(unit.postcode || '');
    setSquareFeet(unit.squareFeet != null ? String(unit.squareFeet) : '');
  }, [unit.unitSlug]);

  useUnsavedChangesGuard(
    name !== unit.unitName || displayTitle !== (unit.displayTitle || '') || suppliedSpecs !== (unit.suppliedSpecs || '')
    || description !== (unit.description || '')
    || postcode !== (unit.postcode || '') || squareFeet !== (unit.squareFeet != null ? String(unit.squareFeet) : '')
  );

  const stFld = 'w-full bg-[#f9f7f2] border border-navy/10 rounded-lg px-4 py-3 font-body text-sm text-navy focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]/20 transition-all';
  const stLbl = 'block font-label text-[10px] font-bold text-navy/60 uppercase tracking-widest mb-2';
  const effectivePublicTitle = unit.displayTitle?.trim() || cleanListingTitle(originalAirbnbTitle) || originalAirbnbTitle;
  const displayTitleDirty = displayTitle !== (unit.displayTitle || '');

  return (
    <div className="max-w-3xl">
      <section className="bg-white rounded-xl shadow-sm border border-navy/5 p-8 md:p-10">
        <header className="mb-8 pb-6 border-b border-navy/5 flex items-center justify-between">
          <div>
            <h3 className="font-display text-2xl font-semibold" style={{ color: NAVY }}>Dados do apartamento</h3>
            <p className="font-body text-sm mt-1" style={{ color: 'rgba(16,28,45,0.5)' }}>Como o apartamento aparece no site.</p>
          </div>
          <SaveStatus s={status} error={lastError} />
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-7">
          {/* Internal name */}
          <div className="md:col-span-2">
            <label className={stLbl}>Nome interno</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              onBlur={() => name !== unit.unitName && save({ unitName: name })}
              className={stFld} placeholder="Apartment 11.2" />
            <p className="font-body text-[10px] mt-1.5" style={{ color: 'rgba(16,28,45,0.35)' }}>Usado no admin e como título no site quando o título público está vazio.</p>
          </div>

          {/* Display title */}
          <div className="md:col-span-2">
            <label className={stLbl}>Título público</label>
            <input value={displayTitle} onChange={(e) => setDisplayTitle(e.target.value)}
              onBlur={() => displayTitleDirty && save({ displayTitle: displayTitle || null }).then((saved) => saved && onChanged())}
              className={stFld} placeholder="Vazio = usa o nome automático" />
            <div className="mt-2 rounded-lg border border-navy/5 bg-[#f9f7f2] px-4 py-3 font-body text-xs leading-relaxed" aria-live="polite">
              <p style={{ color: 'rgba(16,28,45,0.55)' }}>
                Título no site agora: <span className="font-semibold" style={{ color: GOLD }}>{effectivePublicTitle}</span>
              </p>
              <p className="mt-1" style={{ color: 'rgba(16,28,45,0.4)' }}>
                Título original no Airbnb: <span style={{ color: 'rgba(16,28,45,0.65)' }}>{originalAirbnbTitle}</span>
              </p>
              {displayTitleDirty && (
                <p className="mt-1" style={{ color: '#8a641f' }}>Alteração não salva — clique fora do campo para salvar.</p>
              )}
            </div>
          </div>

          {/* Supplied specifications */}
          <div className="md:col-span-2">
            <label className={stLbl}>Specs</label>
            <input
              value={suppliedSpecs}
              onChange={(event) => setSuppliedSpecs(event.target.value)}
              onBlur={() => suppliedSpecs !== (unit.suppliedSpecs || '')
                && save({ suppliedSpecs: suppliedSpecs || null }).then((saved) => saved && onChanged())}
              className={stFld}
              placeholder="2BED 2BATH"
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className={stLbl}>Descrição (em inglês, aparece no site)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              onBlur={() => description !== (unit.description || '') && save({ description: description || null })}
              className={`${stFld} resize-none leading-relaxed`} rows={6}
              placeholder="Descrição do apartamento, espaço, localização…" />
            <p className="font-body text-[10px] mt-1.5" style={{ color: 'rgba(16,28,45,0.35)' }}>{description.length} characters</p>
          </div>

          {/* Postcode */}
          <div>
            <label className={stLbl}>Postcode</label>
            <input value={postcode} onChange={(e) => setPostcode(e.target.value)}
              onBlur={() => postcode !== (unit.postcode || '') && save({ postcode: postcode || null })}
              className={stFld} placeholder="M2 1HN" />
          </div>

          {/* Square footage */}
          <div>
            <label className={stLbl}>Área (sq ft)</label>
            <div className="relative">
              <input type="number" min={0} value={squareFeet} onChange={(e) => setSquareFeet(e.target.value)}
                onBlur={() => {
                  const v = squareFeet ? parseInt(squareFeet, 10) : null;
                  if (v !== unit.squareFeet) save({ squareFeet: v });
                }}
                className={`${stFld} pr-12`} placeholder="800" />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-body text-sm font-semibold" style={{ color: 'rgba(16,28,45,0.35)' }}>ft²</span>
            </div>
            {squareFeet !== '' && parseInt(squareFeet, 10) < 0 && (
              <p className="font-body text-[10px] mt-1" style={{ color: '#ba1a1a' }}>A área não pode ser negativa.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TAB: Rooms & Capacity
// ══════════════════════════════════════════════════════════════════
function RoomsTab({ unit, api, onChanged }: { unit: FullUnit; api: ReturnType<typeof useApi>; onChanged: () => void }) {
  const { save, status, lastError } = useAutosave(api, unit.unitSlug);
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

  useUnsavedChangesGuard(
    nf(maxGuests, unit.maxGuests) || nf(bedrooms, unit.bedrooms) || nf(beds, unit.beds)
    || nf(bathrooms, unit.bathrooms) || nf(ensuite, unit.ensuiteBathrooms) || nf(wc, unit.wcCount) || nf(floor, unit.floor)
  );

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
        <p className="font-display text-headline-sm text-primary">Cômodos e capacidade</p>
        <SaveStatus s={status} error={lastError} />
      </div>
      <p className="font-body text-sm text-on-surface-variant -mt-4">
        Os valores aqui definem as categorias geradas automaticamente no Photo Tour.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
        {numField('Hóspedes máximos', maxGuests, setMaxGuests, () => nf(maxGuests, unit.maxGuests) && save({ maxGuests: n(maxGuests) }))}
        {numField('Quartos (bedrooms)', bedrooms, setBedrooms, () => nf(bedrooms, unit.bedrooms) && save({ bedrooms: n(bedrooms) }).then(onChanged))}
        {numField('Camas (beds)', beds, setBeds, () => nf(beds, unit.beds) && save({ beds: n(beds) }))}
        {numField('Banheiros', bathrooms, setBathrooms, () => nf(bathrooms, unit.bathrooms) && save({ bathrooms: n(bathrooms) }).then(onChanged))}
        {numField('Ensuites', ensuite, setEnsuite, () => nf(ensuite, unit.ensuiteBathrooms) && save({ ensuiteBathrooms: n(ensuite) }).then(onChanged))}
        {numField('WCs', wc, setWc, () => nf(wc, unit.wcCount) && save({ wcCount: n(wc) }).then(onChanged))}
        {numField('Piso', floor, setFloor, () => nf(floor, unit.floor) && save({ floor: n(floor) }))}
      </div>

      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input type="checkbox" checked={hasLift}
          onChange={(e) => { setHasLift(e.target.checked); save({ hasLift: e.target.checked }); }}
          className="w-4 h-4 accent-[#C5A059]" />
        <span className="font-body text-sm text-on-surface">O prédio tem elevador</span>
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
          As categorias dinâmicas (Bedroom 1, Bathroom 1, etc.) são geradas com base nos valores acima. Salve os valores e recarregue para ver as categorias atualizadas.
        </p>
      </div>
    </div>
  );
}

function ReviewsCanonicalLink({ unit }: { unit: FullUnit }) {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <p className="font-display text-headline-sm text-primary">Avaliações</p>
        <p className="font-body text-sm text-on-surface-variant mt-1">
          As avaliações são gerenciadas na página Avaliações.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="border border-outline-variant/20 rounded-xl shadow-sm p-5">
          <p className="font-display text-3xl text-primary">{unit.reviewsCount}</p>
          <p className="font-body text-[10px] uppercase tracking-widest text-on-surface-variant/60 mt-1">Avaliações publicadas</p>
        </div>
        <div className="border border-outline-variant/20 rounded-xl shadow-sm p-5">
          <p className="font-display text-3xl text-primary">{unit.avgRating != null ? unit.avgRating.toFixed(2) : '—'}</p>
          <p className="font-body text-[10px] uppercase tracking-widest text-on-surface-variant/60 mt-1">Nota média</p>
        </div>
      </div>
      <Link
        to={`/admin/reviews?unit=${encodeURIComponent(unit.unitSlug)}`}
        className="inline-flex items-center px-5 py-2.5 font-body text-[11px] uppercase tracking-[0.15em] border transition-colors"
        style={{ borderColor: GOLD, color: GOLD }}
      >
        Gerenciar as avaliações deste apartamento →
      </Link>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TAB: Booking
// ══════════════════════════════════════════════════════════════════
function BookingTab({ unit, api }: { unit: FullUnit; api: ReturnType<typeof useApi> }) {
  const { save, status, lastError } = useAutosave(api, unit.unitSlug);
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
        <SaveStatus s={status} error={lastError} />
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
        Use a página "Disponibilidade" do admin para forçar uma sincronização manual.
      </p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TAB: Settings
// ══════════════════════════════════════════════════════════════════
function SettingsTab({ unit, api, onChanged }: { unit: FullUnit; api: ReturnType<typeof useApi>; onChanged: () => void }) {
  const { save, status, lastError } = useAutosave(api, unit.unitSlug);
  const [visible, setVisible] = useState(unit.visible);
  const [featured, setFeatured] = useState<string[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [featuredStatus, setFeaturedStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [featuredError, setFeaturedError] = useState('');
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

  const loadFeatured = useCallback(async () => {
    setFeaturedLoading(true);
    setFeaturedError('');
    try {
      const site = await api('/admin/site');
      const value = site?.content?.['home.featured'];
      setFeatured(Array.isArray(value) ? value.filter((slug): slug is string => typeof slug === 'string') : []);
    } catch (loadError) {
      setFeaturedError(loadError instanceof Error ? loadError.message : 'Erro ao carregar destaques');
      setFeaturedStatus('error');
    } finally {
      setFeaturedLoading(false);
    }
  }, [api]);

  useEffect(() => { loadFeatured(); }, [loadFeatured]);

  async function saveFeatured(next: string[]) {
    const previous = featured;
    setFeatured(next);
    setFeaturedStatus('saving');
    setFeaturedError('');
    try {
      await api('/admin/content/home.featured', {
        method: 'PUT',
        body: JSON.stringify({ value: next }),
      });
      setFeaturedStatus('saved');
      setTimeout(() => setFeaturedStatus('idle'), 1500);
    } catch (saveError) {
      setFeatured(previous);
      setFeaturedStatus('error');
      setFeaturedError(saveError instanceof Error ? saveError.message : 'Erro ao salvar destaques');
    }
  }

  const isFeatured = featured.includes(unit.unitSlug);
  const featuredPosition = featured.indexOf(unit.unitSlug);

  useUnsavedChangesGuard(
    visible !== unit.visible || displayOrder !== String(unit.displayOrder) || seoTitle !== (unit.seoTitle || '')
    || metaDesc !== (unit.metaDescription || '') || notes !== (unit.internalNotes || '')
    || lat !== (unit.latitude != null ? String(unit.latitude) : '') || lng !== (unit.longitude != null ? String(unit.longitude) : '')
  );

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex items-center gap-4">
        <p className="font-display text-headline-sm text-primary">Configurações</p>
        <SaveStatus s={status} error={lastError} />
      </div>

      {/* Visibility toggle */}
      <div className="border border-outline-variant/20 rounded-xl shadow-sm p-5 space-y-4">
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

      {/* Homepage featured placement — intentionally remains SiteContent['home.featured']. */}
      <div className="border border-outline-variant/20 rounded-xl shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-4">
          <p className={lbl}>Em destaque na Home</p>
          <SaveStatus s={featuredStatus} error={featuredError} />
        </div>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <button
            type="button"
            disabled={featuredLoading || featuredStatus === 'saving'}
            onClick={() => saveFeatured(
              isFeatured
                ? featured.filter((slug) => slug !== unit.unitSlug)
                : [...featured, unit.unitSlug],
            )}
            aria-pressed={isFeatured}
            className="flex items-center gap-3 font-body text-sm text-on-surface disabled:opacity-50"
          >
            <span
              className="relative inline-flex w-12 h-6 rounded-full transition-colors"
              style={{ background: isFeatured ? GOLD : '#9ca3af' }}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${isFeatured ? 'left-6' : 'left-0.5'}`} />
            </span>
            <span>{featuredLoading ? 'Carregando…' : isFeatured ? 'Em destaque na home' : 'Fora dos destaques da home'}</span>
          </button>

          {isFeatured && (
            <label className="flex items-center gap-2 font-body text-[10px] uppercase tracking-[0.12em] text-on-surface-variant/70">
              Ordem
              <input
                type="number"
                min={1}
                max={featured.length}
                value={featuredPosition + 1}
                disabled={featuredStatus === 'saving'}
                onChange={(event) => {
                  const position = Number(event.target.value);
                  if (Number.isFinite(position)) {
                    saveFeatured(moveFeaturedSlug(featured, unit.unitSlug, position - 1));
                  }
                }}
                className="w-14 bg-transparent border-b border-outline-variant/50 py-1 text-center font-body text-sm text-on-surface focus:outline-none focus:border-[#C5A059] disabled:opacity-50"
              />
            </label>
          )}
        </div>
        <p className="font-body text-xs text-on-surface-variant/50">
          A ordem usa a mesma lista de destaques da página inicial; 1 aparece primeiro.
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
            {lat !== '' && (parseFloat(lat) < -90 || parseFloat(lat) > 90) && (
              <p className="font-body text-[10px] mt-1" style={{ color: '#ba1a1a' }}>A latitude deve estar entre -90 e 90.</p>
            )}
          </div>
          <div>
            <label className={lbl}>Longitude</label>
            <input type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value)}
              onBlur={() => { const v = lng ? parseFloat(lng) : null; if (v !== unit.longitude) save({ longitude: v }); }}
              className={fld} placeholder="-2.2453" />
            {lng !== '' && (parseFloat(lng) < -180 || parseFloat(lng) > 180) && (
              <p className="font-body text-[10px] mt-1" style={{ color: '#ba1a1a' }}>A longitude deve estar entre -180 e 180.</p>
            )}
          </div>
        </div>
        <p className="font-body text-[10px] text-on-surface-variant/60">
          Posicionam o pin no mapa "The Neighborhood" da página deste apartamento. Vazio = usa o pin do prédio (Content → Mapa).
          Use o Google Maps para obter as coordenadas exatas (clique com o botão direito no local).
        </p>
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
        <p className="font-body text-xs">Prédio: <code className="font-mono">{unit.propertySlug}</code></p>
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

  const { token, logout } = useAdminAuth();
  const api = useApi(token, logout);

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

  useEffect(() => { loadUnit(); }, [loadUnit]);

  const tabs: { id: ApartmentTab; label: string }[] = [
    { id: 'overview', label: 'Resumo' },
    { id: 'content', label: 'Conteúdo' },
    { id: 'rooms', label: 'Cômodos' },
    { id: 'photos', label: 'Fotos' },
    { id: 'photo-tour', label: 'Photo Tour' },
    { id: 'reviews', label: 'Avaliações' },
    { id: 'booking', label: 'Reservas' },
    { id: 'settings', label: 'Configurações' },
  ];

  const publicUrl = unit
    ? (unit.propertySlug ? `/properties/${unit.propertySlug}/${unit.unitSlug}` : `/property/${unit.unitSlug}`)
    : '#';

  return (
    <AdminShell
      navItems={ADMIN_NAV_ITEMS}
      activeId="apartments"
      breadcrumbs={[
        { label: 'Apartamentos', onClick: () => navigate('/admin/apartments') },
        { label: unit ? unit.unitName : (unitSlug || '') },
      ]}
      rightSlot={
        unit && (
          <>
            <span className="shrink-0 px-2 py-0.5 rounded-full font-body text-[8px] uppercase tracking-widest text-white"
              style={{ background: unit.visible ? '#3f7d5b' : '#6b7280' }}>
              {unit.visible ? 'Visível' : 'Oculto'}
            </span>
            <a href={publicUrl} target="_blank" rel="noopener noreferrer"
              className="shrink-0 font-body text-[10px] uppercase tracking-[0.12em] text-white/50 hover:text-white border border-white/20 px-3 py-1.5 hover:bg-white/10 transition-colors rounded">
              Ver público →
            </a>
          </>
        )
      }
    >
      {/* Page header + horizontal tab bar */}
      <div className="-mx-4 md:-mx-10 -mt-10 px-4 md:px-8 pt-8 pb-0 mb-0"
        style={{ background: '#f9f7f2', borderBottom: '1px solid rgba(16,28,45,0.07)' }}>
        {unit && (
          <div className="mb-4">
            <h2 className="font-display text-4xl font-bold" style={{ color: NAVY }}>
              {unit.displayTitle || unit.unitName}
            </h2>
            {unit.updatedAt && (
              <p className="font-body text-[10px] uppercase tracking-widest mt-1" style={{ color: 'rgba(16,28,45,0.4)' }}>
                Atualizado em {new Date(unit.updatedAt).toLocaleString('pt-BR', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            )}
          </div>
        )}
        {/* Tab row */}
        <div className="flex gap-8 border-b border-navy/10 -mb-px">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="px-1 py-4 font-body font-semibold text-sm transition-colors border-b-2 whitespace-nowrap"
              style={{
                borderColor: tab === t.id ? GOLD : 'transparent',
                color: tab === t.id ? GOLD : 'rgba(16,28,45,0.5)',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content area */}
      <div className="pt-8">
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
            {tab === 'photos' && <UnitMediaWorkspace unit={unit} api={api} onChanged={loadUnit} />}
            {tab === 'photo-tour' && <UnitPhotoTourPreview unit={unit} />}
            {tab === 'reviews' && <ReviewsCanonicalLink unit={unit} />}
            {tab === 'booking' && <BookingTab unit={unit} api={api} />}
            {tab === 'settings' && <SettingsTab unit={unit} api={api} onChanged={loadUnit} />}
          </>
        )}
      </div>
    </AdminShell>
  );
}
