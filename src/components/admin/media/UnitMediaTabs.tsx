import { useEffect, useMemo, useState } from 'react';
import { getListingMedia } from '../../../data/listingMedia';
import { useApi } from '../../../hooks/useAdminApi';
import { MediaGrid } from './MediaGrid';
import { getMediaKey, type MediaGroup, type MediaItem, type MediaMetadataPatch, type MediaOwner } from './types';
import { useMediaMutations } from './useMediaMutations';

const GOLD = '#C5A059';
const NAVY = '#101c2d';

type UnitMediaDetails = {
  unitSlug: string;
  unitName: string;
  bedrooms: number | null;
  bathrooms: number | null;
  ensuiteBathrooms: number | null;
  wcCount: number | null;
  photos: MediaItem[];
};

type UnitMediaTabProps = {
  unit: UnitMediaDetails;
  api: ReturnType<typeof useApi>;
  onChanged: () => void | Promise<void>;
};

type LocalMediaPatch = MediaMetadataPatch & Partial<Pick<MediaItem, 'displayOrder'>>;

function getUnitCategories(unit: Pick<UnitMediaDetails, 'bedrooms' | 'bathrooms' | 'ensuiteBathrooms' | 'wcCount'>): string[] {
  const bedrooms = unit.bedrooms ?? 3;
  const bathrooms = unit.bathrooms ?? 1;
  const ensuite = unit.ensuiteBathrooms || 0;
  const wc = unit.wcCount || 0;

  const categories = ['Living room', 'Full kitchen', 'Kitchen', 'Dining area'];
  for (let index = 1; index <= bedrooms; index++) categories.push(`Bedroom ${index}`);
  if (bathrooms === 1) categories.push('Full bathroom');
  else for (let index = 1; index <= bathrooms; index++) categories.push(`Bathroom ${index}`);
  if (ensuite === 1) categories.push('Ensuite bathroom');
  else for (let index = 1; index <= ensuite; index++) categories.push(`Ensuite bathroom ${index}`);
  if (wc === 1) categories.push('WC');
  else for (let index = 1; index <= wc; index++) categories.push(`WC ${index}`);
  categories.push('Balcony', 'Terrace', 'Workspace', 'Entrance', 'Hallway', 'Exterior', 'Building', 'Shared areas', 'Other');
  return categories;
}

function buildUnitMediaItems(unit: UnitMediaDetails, airbnbUrls: string[]): MediaItem[] {
  const saved = [...unit.photos].sort((a, b) => a.displayOrder - b.displayOrder);
  const savedUrls = new Set(saved.map((photo) => photo.url));
  const references = airbnbUrls
    .filter((url) => !savedUrls.has(url))
    .map<MediaItem>((url, index) => ({
      url,
      alt: unit.unitName,
      isPrimary: false,
      displayOrder: saved.length + index,
      roomCategory: null,
      hidden: false,
    }));
  return [...saved, ...references];
}

function getOrderedCategoryKeys(items: MediaItem[], categories: string[]): string[] {
  const keys = ['', ...categories];
  for (const item of items) {
    const category = item.roomCategory || '';
    if (!keys.includes(category)) keys.push(category);
  }
  return keys;
}

function getGroups(items: MediaItem[], categoryKeys: string[], includeEmptyCategories: boolean): MediaGroup[] {
  return categoryKeys
    .map((key) => ({
      key,
      label: key || 'Sem categoria',
      items: items.filter((item) => (item.roomCategory || '') === key),
    }))
    .filter((group) => includeEmptyCategories || group.items.length > 0);
}

export function UnitMediaWorkspace({ unit, api, onChanged }: UnitMediaTabProps) {
  const owner = useMemo<MediaOwner>(() => ({ ownerType: 'unit', ownerSlug: unit.unitSlug }), [unit.unitSlug]);
  const dynamicCategories = useMemo(
    () => getUnitCategories(unit),
    [unit.bedrooms, unit.bathrooms, unit.ensuiteBathrooms, unit.wcCount],
  );
  const airbnbUrls = useMemo(() => getListingMedia(unit.unitSlug)?.gallery || [], [unit.unitSlug]);
  const [items, setItems] = useState<MediaItem[]>(() => buildUnitMediaItems(unit, airbnbUrls));
  const [pendingKeys, setPendingKeys] = useState<Set<string>>(new Set());
  const [lastError, setLastError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [orderDirty, setOrderDirty] = useState(false);
  const [orderStatus, setOrderStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [bulkTargetCategory, setBulkTargetCategory] = useState('');
  const customCategoriesKey = `mcrh_custom_cats_${unit.unitSlug}`;
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(customCategoriesKey) || '[]');
    } catch {
      return [];
    }
  });
  const [newCategoryName, setNewCategoryName] = useState('');

  const {
    uploadMedia,
    reorderMedia,
    patchMedia,
    deleteMedia,
    saveUnitReferences,
  } = useMediaMutations(api);

  const sourceStateKey = unit.photos
    .map((photo) => [
      photo.id,
      photo.displayOrder,
      photo.roomCategory || '',
      photo.alt || '',
      photo.hidden ? '1' : '0',
      photo.isPrimary ? '1' : '0',
    ].join(':'))
    .join('|');

  useEffect(() => {
    setItems(buildUnitMediaItems(unit, airbnbUrls));
    setOrderDirty(false);
    setSelectedKeys(new Set());
  }, [unit.unitSlug, sourceStateKey, airbnbUrls]); // eslint-disable-line react-hooks/exhaustive-deps

  const allCategories = useMemo(
    () => [...dynamicCategories, ...customCategories.filter((category) => !dynamicCategories.includes(category))],
    [dynamicCategories, customCategories],
  );
  const categoryKeys = useMemo(() => getOrderedCategoryKeys(items, allCategories), [items, allCategories]);
  const groups = useMemo(
    () => getGroups(items, categoryKeys, true).filter((group) => categoryFilter === null || group.key === categoryFilter),
    [items, categoryKeys, categoryFilter],
  );
  const uncategorizedCount = items.filter((item) => !item.roomCategory).length;

  function setPending(item: MediaItem, pending: boolean) {
    const key = getMediaKey(item);
    setPendingKeys((previous) => {
      const next = new Set(previous);
      if (pending) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  async function persistItemPatch(
    item: MediaItem,
    patch: LocalMediaPatch,
    fallbackError: string,
    refresh = true,
  ): Promise<boolean> {
    const key = getMediaKey(item);
    const previous = item;
    const nextItem = { ...item, ...patch };
    setLastError('');
    setPending(item, true);
    setItems((current) => current.map((candidate) => getMediaKey(candidate) === key ? nextItem : candidate));
    try {
      if (item.id) {
        const {
          displayOrder: _displayOrder,
          ...metadataPatch
        } = patch;
        await patchMedia({ owner, mediaId: item.id, patch: metadataPatch });
      } else {
        await saveUnitReferences({
          owner,
          assignments: [{
            url: nextItem.url,
            roomCategory: nextItem.roomCategory,
            displayOrder: nextItem.displayOrder,
            alt: nextItem.alt,
            hidden: nextItem.hidden,
          }],
        });
      }
      if (refresh) await onChanged();
      return true;
    } catch (error) {
      setItems((current) => current.map((candidate) => getMediaKey(candidate) === key ? previous : candidate));
      setLastError(error instanceof Error ? error.message : fallbackError);
      return false;
    } finally {
      setPending(item, false);
    }
  }

  async function changeCategory(item: MediaItem, category: string, refresh = true) {
    const targetCount = items.filter((candidate) => (candidate.roomCategory || '') === category).length;
    return persistItemPatch(
      item,
      { roomCategory: category || null, displayOrder: targetCount },
      'Erro ao guardar categoria',
      refresh,
    );
  }

  function moveWithinCategory(item: MediaItem, category: string, direction: -1 | 1) {
    setItems((current) => {
      const groupItems = current.filter((candidate) => (candidate.roomCategory || '') === category);
      const index = groupItems.findIndex((candidate) => getMediaKey(candidate) === getMediaKey(item));
      const targetIndex = index + direction;
      if (index === -1 || targetIndex < 0 || targetIndex >= groupItems.length) return current;
      const firstIndex = current.findIndex((candidate) => getMediaKey(candidate) === getMediaKey(groupItems[index]));
      const secondIndex = current.findIndex((candidate) => getMediaKey(candidate) === getMediaKey(groupItems[targetIndex]));
      const next = [...current];
      [next[firstIndex], next[secondIndex]] = [next[secondIndex], next[firstIndex]];
      return next;
    });
    setOrderDirty(true);
    setOrderStatus('idle');
  }

  async function saveOrder() {
    setOrderStatus('saving');
    setLastError('');
    const orderedItems = categoryKeys.flatMap((category) =>
      items.filter((item) => (item.roomCategory || '') === category),
    );
    try {
      if (orderedItems.every((item) => item.id)) {
        await reorderMedia({ owner, orderedIds: orderedItems.map((item) => item.id!) });
      } else {
        await saveUnitReferences({
          owner,
          assignments: orderedItems.map((item, index) => ({
            url: item.url,
            roomCategory: item.roomCategory,
            displayOrder: index,
            alt: item.alt,
            hidden: item.hidden,
          })),
        });
      }
      await onChanged();
      setOrderDirty(false);
      setOrderStatus('saved');
      setTimeout(() => setOrderStatus('idle'), 1500);
    } catch (error) {
      setLastError(error instanceof Error ? error.message : 'Erro ao guardar ordem');
      setOrderStatus('error');
    }
  }

  async function upload(file: File) {
    setUploading(true);
    setLastError('');
    try {
      await uploadMedia({ owner, file, alt: unit.unitName });
      await onChanged();
    } catch (error) {
      setLastError(error instanceof Error ? error.message : 'Erro ao enviar foto');
    } finally {
      setUploading(false);
    }
  }

  async function setPrimary(item: MediaItem) {
    if (!item.id) return;
    setPending(item, true);
    setLastError('');
    try {
      await patchMedia({ owner, mediaId: item.id, patch: { isPrimary: true } });
      await onChanged();
    } catch (error) {
      setLastError(error instanceof Error ? error.message : 'Erro ao definir capa');
    } finally {
      setPending(item, false);
    }
  }

  async function editAlt(item: MediaItem) {
    if (!item.id) return;
    const nextAlt = window.prompt('Texto alternativo (descrição da imagem):', item.alt || '');
    if (nextAlt === null || nextAlt === (item.alt || '')) return;
    await persistItemPatch(item, { alt: nextAlt || null }, 'Erro ao guardar texto alternativo');
  }

  async function remove(item: MediaItem) {
    if (!item.id || !window.confirm('Excluir esta foto? Esta ação também remove o ficheiro do armazenamento.')) return;
    setPending(item, true);
    setLastError('');
    try {
      await deleteMedia({ owner, mediaId: item.id });
      setItems((current) => current.filter((candidate) => getMediaKey(candidate) !== getMediaKey(item)));
      await onChanged();
    } catch (error) {
      setLastError(error instanceof Error ? error.message : 'Erro ao excluir foto');
    } finally {
      setPending(item, false);
    }
  }

  function toggleSelected(item: MediaItem) {
    const key = getMediaKey(item);
    setSelectedKeys((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleGroupSelection(group: MediaGroup) {
    setSelectedKeys((previous) => {
      const next = new Set(previous);
      const allSelected = group.items.every((item) => next.has(getMediaKey(item)));
      for (const item of group.items) {
        const key = getMediaKey(item);
        if (allSelected) next.delete(key);
        else next.add(key);
      }
      return next;
    });
  }

  async function applyBulkCategory() {
    if (!bulkTargetCategory || selectedKeys.size === 0) return;
    const category = bulkTargetCategory === '__uncategorized__' ? '' : bulkTargetCategory;
    const selectedItems = items.filter((item) => selectedKeys.has(getMediaKey(item)));
    const results = [];
    for (const item of selectedItems) results.push(await changeCategory(item, category, false));
    if (results.some(Boolean)) await onChanged();
    setSelectedKeys(new Set());
    setBulkTargetCategory('');
  }

  function addCustomCategory() {
    const name = newCategoryName.trim();
    if (!name || allCategories.includes(name)) return;
    const next = [...customCategories, name];
    setCustomCategories(next);
    localStorage.setItem(customCategoriesKey, JSON.stringify(next));
    setNewCategoryName('');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-2xl font-bold text-navy">Fotos</h2>
          <p className="font-body text-xs text-on-surface-variant mt-0.5">
            {items.length} foto{items.length !== 1 ? 's' : ''} · arraste ou use o seletor em cada foto
          </p>
          {lastError && <p className="font-body text-xs text-red-600 mt-1 max-w-md">{lastError}</p>}
        </div>
        {orderDirty && (
          <button
            onClick={saveOrder}
            disabled={orderStatus === 'saving'}
            className="shrink-0 px-4 py-2 font-body text-[11px] uppercase tracking-[0.15em] text-white transition-all disabled:opacity-60"
            style={{ background: GOLD }}
          >
            {orderStatus === 'saving' ? 'Salvando…' : orderStatus === 'saved' ? '✓ Ordem salva' : 'Salvar ordem'}
          </button>
        )}
      </div>

      {pendingKeys.size > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded border border-outline-variant/20 bg-surface-container/40">
          <span className="font-body text-[11px] text-on-surface-variant/70" style={{ color: GOLD }}>
            Salvando {pendingKeys.size} foto{pendingKeys.size !== 1 ? 's' : ''}…
          </span>
        </div>
      )}

      {uncategorizedCount > 0 && (
        <div className="px-4 py-3 rounded-lg border border-amber-200 bg-amber-50/60">
          <span className="font-body text-sm text-amber-700">
            ⚠ {uncategorizedCount} foto{uncategorizedCount !== 1 ? 's' : ''} sem categoria — use o seletor ou arraste para uma secção abaixo
          </span>
        </div>
      )}

      {items.length === 0 && (
        <div className="border border-dashed border-outline-variant/40 rounded-xl px-6 py-16 text-center">
          <p className="font-body text-sm text-on-surface-variant/60">Nenhuma foto encontrada para este apartamento.</p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="font-body text-[10px] uppercase tracking-[0.15em] text-on-surface-variant/60 shrink-0">Filtrar:</span>
        <button
          onClick={() => setCategoryFilter(null)}
          className="px-2.5 py-1 rounded-full font-body text-[10px] uppercase tracking-widest transition-colors"
          style={categoryFilter === null
            ? { background: NAVY, color: '#fff' }
            : { border: '1px solid rgba(0,0,0,0.15)', color: 'rgba(0,0,0,0.5)' }}
        >
          Todas
        </button>
        <button
          onClick={() => setCategoryFilter('')}
          className="px-2.5 py-1 rounded-full font-body text-[10px] uppercase tracking-widest transition-colors"
          style={categoryFilter === ''
            ? { background: '#92400e', color: '#fff' }
            : { border: '1px solid rgba(0,0,0,0.15)', color: 'rgba(0,0,0,0.5)' }}
        >
          Sem categoria ({uncategorizedCount})
        </button>
        {allCategories.map((category) => (
          <button
            key={category}
            onClick={() => setCategoryFilter(category)}
            className="px-2.5 py-1 rounded-full font-body text-[10px] uppercase tracking-widest transition-colors"
            style={categoryFilter === category
              ? { background: GOLD, color: '#fff' }
              : { border: '1px solid rgba(0,0,0,0.15)', color: 'rgba(0,0,0,0.5)' }}
          >
            {category} ({items.filter((item) => item.roomCategory === category).length})
          </button>
        ))}
      </div>

      {selectedKeys.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border" style={{ borderColor: GOLD, background: 'rgba(197,160,89,0.08)' }}>
          <span className="font-body text-xs text-on-surface">
            {selectedKeys.size} selecionada{selectedKeys.size !== 1 ? 's' : ''}
          </span>
          <select
            value={bulkTargetCategory}
            onChange={(event) => setBulkTargetCategory(event.target.value)}
            className="bg-surface border border-outline-variant/30 font-body text-[11px] text-on-surface-variant py-1 px-2 rounded-sm"
          >
            <option value="">Mover para…</option>
            <option value="__uncategorized__">— sem categoria —</option>
            {allCategories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
          <button
            onClick={applyBulkCategory}
            disabled={!bulkTargetCategory}
            className="px-3 py-1 font-body text-[10px] uppercase tracking-[0.15em] text-white disabled:opacity-40"
            style={{ background: GOLD }}
          >
            Aplicar
          </button>
          <button
            onClick={() => setSelectedKeys(new Set())}
            className="font-body text-[10px] uppercase tracking-widest text-on-surface-variant/60 hover:text-on-surface-variant ml-auto"
          >
            Limpar seleção
          </button>
        </div>
      )}

      <div className="flex items-center gap-3 pb-2 border-b border-outline-variant/20">
        <span className="font-body text-[10px] uppercase tracking-[0.15em] text-on-surface-variant shrink-0">Nova categoria</span>
        <input
          value={newCategoryName}
          onChange={(event) => setNewCategoryName(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && addCustomCategory()}
          placeholder="Ex: Bedroom 4, Estúdio, Varanda Sul…"
          className="flex-1 bg-transparent border-b border-outline-variant/40 py-1 font-body text-sm text-on-surface focus:outline-none focus:border-[#C5A059] transition-colors"
        />
        <button
          onClick={addCustomCategory}
          disabled={!newCategoryName.trim() || allCategories.includes(newCategoryName.trim())}
          className="shrink-0 px-4 py-1.5 font-body text-[11px] uppercase tracking-[0.15em] text-white disabled:opacity-40 transition-opacity"
          style={{ background: GOLD }}
        >
          Adicionar
        </button>
      </div>

      <MediaGrid
        owner={owner}
        groups={groups}
        categories={allCategories}
        pendingKeys={pendingKeys}
        selectedKeys={selectedKeys}
        selectable
        renderUpload={() => (
          <label
            className={`aspect-[4/3] rounded-xl border-2 border-dashed border-outline-variant/40 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors hover:border-[#C5A059] ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
            title="Adicionar foto"
          >
            <span className="text-xl" style={{ color: GOLD }}>＋</span>
            <span className="font-body text-[9px] uppercase tracking-widest text-on-surface-variant/60">
              {uploading ? 'Enviando…' : 'Adicionar foto'}
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
        onToggleSelected={(_, item) => toggleSelected(item)}
        onToggleGroupSelection={(_, group) => toggleGroupSelection(group)}
        onMove={(_, item, category, direction) => moveWithinCategory(item, category, direction)}
        onMoveToGroup={(_, item, category) => {
          if ((item.roomCategory || '') !== category) changeCategory(item, category);
        }}
        onCategoryChange={(_, item, category) => changeCategory(item, category)}
        onToggleHidden={(_, item) => persistItemPatch(item, { hidden: !item.hidden }, 'Erro ao alterar visibilidade')}
        onSetPrimary={(_, item) => setPrimary(item)}
        onEditAlt={(_, item) => editAlt(item)}
        onDelete={(_, item) => remove(item)}
      />
    </div>
  );
}

export function UnitPhotoTourPreview({ unit }: { unit: UnitMediaDetails }) {
  const owner = useMemo<MediaOwner>(() => ({ ownerType: 'unit', ownerSlug: unit.unitSlug }), [unit.unitSlug]);
  const categories = useMemo(
    () => getUnitCategories(unit),
    [unit.bedrooms, unit.bathrooms, unit.ensuiteBathrooms, unit.wcCount],
  );
  const visiblePhotos = useMemo(
    () => [...unit.photos].filter((photo) => !photo.hidden).sort((a, b) => a.displayOrder - b.displayOrder),
    [unit.photos],
  );
  const categoryKeys = useMemo(() => getOrderedCategoryKeys(visiblePhotos, categories), [visiblePhotos, categories]);
  const groups = useMemo(() => getGroups(visiblePhotos, categoryKeys, false), [visiblePhotos, categoryKeys]);
  const uncategorizedCount = visiblePhotos.filter((photo) => !photo.roomCategory).length;
  const sectionCount = groups.filter((group) => group.key !== '').length;
  const categorizedCount = visiblePhotos.filter((photo) => photo.roomCategory).length;

  return (
    <div className="space-y-8">
      <div>
        <p className="font-display text-headline-sm text-primary mb-1">Photo Tour — pré-visualização</p>
        <p className="font-body text-sm text-on-surface-variant">
          Como as fotos serão agrupadas no Photo Tour público. Para atribuir categorias, use a aba "Fotos".
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="border border-outline-variant/20 rounded-xl shadow-sm p-4 text-center">
          <p className="font-display text-3xl text-primary">{sectionCount}</p>
          <p className="font-body text-[10px] uppercase tracking-widest text-on-surface-variant/60 mt-1">Secções</p>
        </div>
        <div className="border border-outline-variant/20 rounded-xl shadow-sm p-4 text-center">
          <p className="font-display text-3xl text-primary">{categorizedCount}</p>
          <p className="font-body text-[10px] uppercase tracking-widest text-on-surface-variant/60 mt-1">Fotos categorizadas</p>
        </div>
        <div
          className="rounded-lg p-4 text-center border"
          style={{ borderColor: uncategorizedCount > 0 ? '#fbbf24' : '#e2e8f0' }}
        >
          <p className="font-display text-3xl" style={{ color: uncategorizedCount > 0 ? '#d97706' : '#3f7d5b' }}>
            {uncategorizedCount}
          </p>
          <p className="font-body text-[10px] uppercase tracking-widest text-on-surface-variant/60 mt-1">Sem categoria</p>
        </div>
      </div>

      {uncategorizedCount > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-amber-200 bg-amber-50/60">
          <span className="font-body text-sm text-amber-700">
            ⚠ {uncategorizedCount} foto{uncategorizedCount !== 1 ? 's' : ''} sem categoria não aparecer{uncategorizedCount !== 1 ? 'ão' : 'á'} no Photo Tour público.
            Classifique-as na aba "Fotos".
          </span>
        </div>
      )}

      {groups.length === 0
        ? <p className="font-body text-sm text-on-surface-variant">Nenhuma foto carregada ainda.</p>
        : <MediaGrid owner={owner} groups={groups} variant="preview" />}
    </div>
  );
}
