// Split out of the former single-file admin (src/pages/Admin.tsx).
import { useMemo, useRef, useState } from 'react';
import { ROOM_CATEGORIES } from '../../PhotoTour';
import type { useApi } from '../../../hooks/useAdminApi';
import { MediaGrid, getMediaKey, useMediaMutations, type MediaItem, type MediaOwner } from '../media';
import { label, field, Status, type Unit } from './shared';

// ── Photos — per-apartment photo manager ──────────────────────────────
export function PhotosTab({ units, api, onChanged }: { units: Unit[]; api: ReturnType<typeof useApi>; onChanged: () => void | Promise<void> }) {
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
      setError(moveError instanceof Error ? moveError.message : 'Erro ao salvar ordem');
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
      setError(bulkError instanceof Error ? bulkError.message : 'Erro ao salvar categorias');
    } finally {
      withIds.forEach((item) => setPending(item, false));
    }
  }

  async function editAlt(item: MediaItem) {
    const next = window.prompt('Alt text:', item.alt || '');
    if (next === null || next === (item.alt || '')) return;
    await patchPhoto(item, { alt: next || null }, 'Erro ao salvar texto alternativo');
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
        <p className="font-body text-sm text-on-surface-variant">Selecione um prédio e um apartamento. As fotos são separadas por cômodo e aparecem assim no Photo Tour público.</p>
      </div>

      {/* Building + apartment selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className={label}>Prédio / coleção</label>
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
        <p className="font-body text-sm text-on-surface-variant/50">Selecione um prédio para continuar.</p>
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
                + Enviar fotos
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
                Nenhuma foto. Clique em "+ Enviar fotos" para começar.
              </p>
              <p className="font-body text-xs text-on-surface-variant/40 mt-2">
                As fotos do Airbnb só aparecem no Photo Tour depois de enviadas aqui.
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
                patchPhoto(item, { roomCategory: category || null }, 'Erro ao salvar categoria');
              }
            }}
            onCategoryChange={(_, item, category) =>
              patchPhoto(item, { roomCategory: category || null }, 'Erro ao salvar categoria')}
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

