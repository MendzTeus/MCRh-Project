// Split out of the former single-file admin (src/pages/Admin.tsx).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getInventoryForProperty } from '../../../data/airbnbInventory';
import { Link } from 'react-router-dom';
import type { useApi } from '../../../hooks/useAdminApi';
import { PropertyContentFields } from '../content/PropertyContentFields';
import { MediaGrid, getMediaKey, useMediaMutations, type MediaItem, type MediaOwner } from '../media';
import { GOLD, label, field, Status, type AdminProperty, type Photo, type Unit } from './shared';

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

export function PropertiesTab({
  properties,
  api,
  onPropertyChanged,
}: {
  properties: AdminProperty[];
  api: ReturnType<typeof useApi>;
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
                <PropertyContentFields property={property} api={api} onChanged={onPropertyChanged} />
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
      setError(moveError instanceof Error ? moveError.message : 'Erro ao salvar ordem');
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
      setError(patchError instanceof Error ? patchError.message : 'Erro ao salvar texto alternativo');
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

