import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { CloudDownload, EyeOff, Eye, ImagePlus, Star, Trash2, GripVertical, TriangleAlert, Check } from 'lucide-react';
import { getListingMedia } from '../../../data/listingMedia';
import { fileToBase64, type useApi } from '../../../hooks/useAdminApi';
import { ConfirmDialog } from '../AdminUI';
import { Badge, Button, Card, EmptyState, Notice, SaveIndicator, SectionHeading, fieldInput, type SaveState } from '../ui';
import { roomLabel, suggestedRooms, type RoomCounts } from './roomCategories';
import { arrangePayload, movePhotos, renumber, sortPhotos } from './arrange';

type Api = ReturnType<typeof useApi>;

export type ManagedPhoto = {
  id: string;
  url: string;
  alt: string | null;
  isPrimary: boolean;
  displayOrder: number;
  roomCategory: string | null;
  hidden: boolean;
  /** true = a copy lives in the site's storage; false = only a link to Airbnb */
  stored?: boolean;
  sourceUrl?: string | null;
};

type Unit = RoomCounts & { unitSlug: string; unitName: string; photos: ManagedPhoto[] };

const DRAG_MIME = 'application/x-mcrh-photo';
const NEW_ROOM = '__new__';

/**
 * Everything about an apartment's photos in one place: rooms, order, cover,
 * hidden, uploads and copying photos from Airbnb into the site's storage.
 * Changes save automatically.
 */
export function PhotoManager({ unit, api, supportsImport, onReload }: {
  unit: Unit;
  api: Api;
  /** false until migration 006 (MediaAsset.sourceUrl) has run */
  supportsImport: boolean;
  onReload: () => Promise<void>;
}) {
  const [photos, setPhotos] = useState<ManagedPhoto[]>(unit.photos);
  const [extraRooms, setExtraRooms] = useState<string[]>([]);
  const [broken, setBroken] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dragging, setDragging] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'warn' | 'danger'; text: string } | null>(null);
  const [toDelete, setToDelete] = useState<ManagedPhoto[] | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const uploadRoom = useRef('');
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  // Server data changed (after upload/import/reload) → take it, unless a save is pending.
  const serverKey = unit.photos.map((p) => `${p.id}:${p.displayOrder}:${p.roomCategory}:${p.hidden}:${p.isPrimary}:${p.url}`).join('|');
  useEffect(() => { setPhotos(unit.photos); }, [serverKey]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => clearTimeout(saveTimer.current), []);

  const rooms = useMemo(() => {
    const base = ['', ...suggestedRooms(unit)];
    for (const p of photos) if (p.roomCategory && !base.includes(p.roomCategory)) base.push(p.roomCategory);
    for (const r of extraRooms) if (!base.includes(r)) base.push(r);
    return base;
  }, [unit.bedrooms, unit.bathrooms, unit.ensuiteBathrooms, unit.wcCount, photos, extraRooms]); // eslint-disable-line react-hooks/exhaustive-deps

  const ordered = useMemo(() => sortPhotos(photos, rooms), [photos, rooms]);
  const byRoom = useMemo(() => {
    const map = new Map<string, ManagedPhoto[]>(rooms.map((r) => [r, []]));
    for (const p of ordered) map.get(p.roomCategory || '')?.push(p);
    return map;
  }, [ordered, rooms]);

  // Airbnb photos known to the site but never saved for this apartment.
  const notImported = useMemo(() => {
    const known = new Set(photos.flatMap((p) => [p.url, p.sourceUrl].filter(Boolean) as string[]));
    return (getListingMedia(unit.unitSlug)?.gallery || []).filter((url) => !known.has(url));
  }, [photos, unit.unitSlug]);
  // Hidden links are usually dead Airbnb photos — nothing left to copy.
  const linkOnly = photos.filter((p) => p.stored === false && !p.hidden);

  // ── persistence ────────────────────────────────────────────────────
  const persist = useCallback((next: ManagedPhoto[]) => {
    clearTimeout(saveTimer.current);
    setSaveState('saving');
    saveTimer.current = setTimeout(async () => {
      const items = arrangePayload(next, rooms);
      try {
        await api(`/admin/units/${unit.unitSlug}/photos/arrange`, { method: 'POST', body: JSON.stringify({ items }) });
        setSaveState('saved');
      } catch (err) {
        setSaveError((err as Error).message);
        setSaveState('error');
      }
    }, 450);
  }, [api, rooms, unit.unitSlug]);

  const commit = (next: ManagedPhoto[]) => {
    setPhotos(next);
    persist(next);
  };
  const update = (next: ManagedPhoto[]) => commit(renumber(next, rooms));
  const moveTo = (ids: string[], room: string, beforeId?: string) => commit(movePhotos(photos, rooms, ids, room, beforeId));

  const setHidden = (ids: string[], hidden: boolean) => update(photos.map((p) => (ids.includes(p.id) ? { ...p, hidden } : p)));

  async function setCover(photo: ManagedPhoto) {
    setBusy(photo.id);
    try {
      await api(`/admin/photos/${photo.id}`, { method: 'PATCH', body: JSON.stringify({ isPrimary: true }) });
      setPhotos((cur) => cur.map((p) => ({ ...p, isPrimary: p.id === photo.id })));
    } catch (err) {
      setNotice({ tone: 'danger', text: `Capa não alterada: ${(err as Error).message}` });
    } finally { setBusy(null); }
  }

  async function removePhotos(list: ManagedPhoto[]) {
    setToDelete(null);
    setBusy('delete');
    try {
      for (const p of list) await api(`/admin/photos/${p.id}`, { method: 'DELETE' });
      setPhotos((cur) => cur.filter((p) => !list.some((d) => d.id === p.id)));
      setSelected(new Set());
    } catch (err) {
      setNotice({ tone: 'danger', text: `Nem todas foram excluídas: ${(err as Error).message}` });
      await onReload();
    } finally { setBusy(null); }
  }

  async function uploadFiles(files: File[], room: string) {
    const images = files.filter((f) => f.type.startsWith('image/'));
    if (!images.length) return;
    setBusy('upload');
    setNotice(null);
    let failed = 0;
    const newIds: string[] = [];
    for (const file of images) {
      try {
        const { base64, type } = await fileToBase64(file);
        const res = await api(`/admin/units/${unit.unitSlug}/photos`, { method: 'POST', body: JSON.stringify({ dataBase64: base64, contentType: type, alt: unit.unitName }) });
        if (res?.photo?.id) newIds.push(res.photo.id);
      } catch { failed++; }
    }
    if (room && newIds.length) {
      // Put the new photos straight into the room they were dropped on.
      const fresh = await api(`/admin/units/${unit.unitSlug}`);
      const all: ManagedPhoto[] = fresh.unit.photos;
      const next = all.map((p) => (newIds.includes(p.id) ? { ...p, roomCategory: room } : p));
      const items = arrangePayload(next, rooms);
      await api(`/admin/units/${unit.unitSlug}/photos/arrange`, { method: 'POST', body: JSON.stringify({ items }) }).catch(() => {});
    }
    await onReload();
    setBusy(null);
    setNotice(failed
      ? { tone: 'warn', text: `${images.length - failed} de ${images.length} fotos enviadas. Aceitos: JPG, PNG, WEBP ou AVIF até 8 MB.` }
      : { tone: 'ok', text: `${images.length} foto(s) enviada(s).` });
  }

  async function importFromAirbnb(mode: 'current' | 'links') {
    setBusy(mode);
    setNotice(null);
    try {
      const res = mode === 'current'
        ? await api(`/admin/units/${unit.unitSlug}/photos/import-from-airbnb`, { method: 'POST' })
        : await api(`/admin/units/${unit.unitSlug}/photos/import`, { method: 'POST', body: JSON.stringify({ urls: linkOnly.map((p) => p.url), alt: unit.unitName }) });
      await onReload();
      const parts = [`${res.imported} foto(s) copiada(s) para o site`];
      if (res.alreadyImported) parts.push(`${res.alreadyImported} já estavam salvas`);
      if (res.retired) parts.push(`${res.retired} foto(s) antiga(s), que não existem mais no Airbnb, foram ocultadas`);
      if (res.failed?.length) parts.push(`${res.failed.length} não puderam ser copiadas (${res.failed[0].error})`);
      setNotice({ tone: res.failed?.length ? 'warn' : 'ok', text: `${parts.join(' · ')}.` });
    } catch (err) {
      setNotice({ tone: 'danger', text: (err as Error).message });
    } finally { setBusy(null); }
  }

  // ── drag & drop ────────────────────────────────────────────────────
  const onDragStart = (e: DragEvent, photo: ManagedPhoto) => {
    const ids = selected.has(photo.id) ? [...selected] : [photo.id];
    e.dataTransfer.setData(DRAG_MIME, JSON.stringify(ids));
    e.dataTransfer.effectAllowed = 'move';
    setDragging(photo.id);
  };
  const allowDrop = (e: DragEvent, target: string) => {
    const types = Array.from(e.dataTransfer.types);
    if (!types.includes(DRAG_MIME) && !types.includes('Files')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = types.includes('Files') ? 'copy' : 'move';
    if (dropTarget !== target) setDropTarget(target);
  };
  const onDrop = (e: DragEvent, room: string, beforeId?: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTarget(null);
    setDragging(null);
    if (e.dataTransfer.files?.length) { uploadFiles(Array.from(e.dataTransfer.files) as File[], room); return; }
    const raw = e.dataTransfer.getData(DRAG_MIME);
    if (!raw) return;
    const ids: string[] = JSON.parse(raw);
    if (beforeId && ids.includes(beforeId)) return;
    moveTo(ids, room, beforeId);
    setSelected(new Set());
  };

  const addRoom = (name: string) => {
    const clean = name.trim().slice(0, 60);
    if (!clean) return '';
    if (!rooms.includes(clean)) setExtraRooms((r) => [...r, clean]);
    return clean;
  };
  const pickRoom = (value: string) => (value === NEW_ROOM ? addRoom(window.prompt('Nome do novo cômodo (em inglês, aparece no site). Ex.: Bedroom 3, Terrace') || '') : value);

  const toggleSelect = (id: string) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const selectedPhotos = ordered.filter((p) => selected.has(p.id));
  const uncategorized = byRoom.get('')?.length || 0;
  const hiddenCount = photos.filter((p) => p.hidden).length;
  const brokenCount = photos.filter((p) => broken.has(p.id)).length;

  const roomOptions = (
    <>
      {rooms.map((r) => <option key={r || 'none'} value={r}>{roomLabel(r)}</option>)}
      <option value={NEW_ROOM}>+ Novo cômodo…</option>
    </>
  );

  return (
    <div className="admin-root space-y-6"
      onDragOver={(e) => { if (Array.from(e.dataTransfer.types).includes('Files')) allowDrop(e, 'page'); }}
      onDrop={(e) => { if (e.dataTransfer.files?.length) onDrop(e, ''); }}
      onDragEnd={() => { setDragging(null); setDropTarget(null); }}>

      {/* Summary + actions */}
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-[-0.01em]">Fotos do apartamento</h2>
            <p className="text-sm text-ad-muted mt-1 max-w-[62ch]">
              Arraste as fotos para organizar por cômodo e mudar a ordem. Arraste arquivos do computador para enviar.
              A primeira foto de cada cômodo abre a seção dele no Photo Tour. Tudo salva sozinho.
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <Badge>{photos.length} no site</Badge>
              {uncategorized > 0 && <Badge tone="warn">{uncategorized} sem cômodo</Badge>}
              {hiddenCount > 0 && <Badge>{hiddenCount} ocultas</Badge>}
              {brokenCount > 0 && <Badge tone="danger">{brokenCount} quebradas</Badge>}
              <SaveIndicator state={saveState} error={saveError} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button icon={<ImagePlus size={16} />} busy={busy === 'upload'} onClick={() => { uploadRoom.current = ''; fileInput.current?.click(); }}>
              Enviar fotos
            </Button>
            <Button variant="primary" icon={<CloudDownload size={16} />} busy={busy === 'current'} disabled={!supportsImport}
              onClick={() => importFromAirbnb('current')}>
              Buscar fotos atuais no Airbnb
            </Button>
          </div>
        </div>
        <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="hidden"
          onChange={(e) => { const input = e.target as HTMLInputElement; const files = Array.from(input.files || []) as File[]; input.value = ''; uploadFiles(files, uploadRoom.current); }} />
      </Card>

      {!supportsImport && (
        <Notice tone="warn" title="Falta um passo no banco de dados">
          Para copiar fotos do Airbnb para o site, rode a migration <code>006_media_source_url.sql</code> no Supabase (1 linha).
        </Notice>
      )}
      {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}
      {supportsImport && linkOnly.length > 0 && (
        <Notice tone="warn" title={`${linkOnly.length} foto(s) ainda dependem do Airbnb`}
          actions={<Button size="sm" busy={busy === 'links'} onClick={() => importFromAirbnb('links')}>Copiar para o site</Button>}>
          São só links: se a foto for trocada no Airbnb, some daqui e do site. Copie para guardar uma cópia própria.
        </Notice>
      )}

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div className="sticky top-20 z-10 flex flex-wrap items-center gap-3 rounded-xl bg-ad-ink text-white px-4 py-3 shadow-[var(--shadow-ad-lift)]">
          <span className="text-sm font-medium">{selected.size} selecionada(s)</span>
          <select aria-label="Mover selecionadas para" className="h-8 rounded-md bg-white/10 border border-white/20 px-2 text-sm"
            value="" onChange={(e) => { const room = pickRoom(e.target.value); if (room !== '' || e.target.value === '') moveTo([...selected], room); setSelected(new Set()); }}>
            <option value="" disabled>Mover para…</option>
            {roomOptions}
          </select>
          <button className="text-sm underline-offset-2 hover:underline" onClick={() => { setHidden([...selected], true); setSelected(new Set()); }}>Ocultar</button>
          <button className="text-sm underline-offset-2 hover:underline" onClick={() => { setHidden([...selected], false); setSelected(new Set()); }}>Mostrar</button>
          <button className="text-sm text-red-200 underline-offset-2 hover:underline" onClick={() => setToDelete(selectedPhotos)}>Excluir</button>
          <button className="ml-auto text-sm text-white/70 hover:text-white" onClick={() => setSelected(new Set())}>Limpar seleção</button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* Room list — also a drop target */}
        <nav aria-label="Cômodos" className="lg:sticky lg:top-20 self-start">
          <Card padded={false} className="p-2">
            <ul className="space-y-0.5">
              {rooms.filter((r) => r === '' || (byRoom.get(r)?.length || 0) > 0 || extraRooms.includes(r)).map((room) => (
                <li key={room || 'none'}>
                  <a href={`#room-${encodeURIComponent(room || 'none')}`}
                    onDragOver={(e) => allowDrop(e, `nav:${room}`)} onDragLeave={() => setDropTarget(null)} onDrop={(e) => onDrop(e, room)}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${dropTarget === `nav:${room}` ? 'bg-ad-accent-soft ring-2 ring-ad-accent/40' : 'hover:bg-ad-sunken'}`}>
                    <span className={room ? 'text-ad-ink' : 'text-ad-warn font-medium'}>{roomLabel(room)}</span>
                    <span className="text-xs text-ad-faint">{byRoom.get(room)?.length || 0}</span>
                  </a>
                </li>
              ))}
            </ul>
            <label className="block px-3 pt-3 pb-2 text-xs text-ad-muted">
              Mais cômodos
              <select className={`${fieldInput} h-9 mt-1`} value="" onChange={(e) => { const r = pickRoom(e.target.value); if (r) setExtraRooms((x) => (x.includes(r) ? x : [...x, r])); }}>
                <option value="" disabled>Adicionar à lista…</option>
                {rooms.filter((r) => r && !(byRoom.get(r)?.length) && !extraRooms.includes(r)).map((r) => <option key={r} value={r}>{roomLabel(r)}</option>)}
                <option value={NEW_ROOM}>+ Novo cômodo…</option>
              </select>
            </label>
          </Card>
        </nav>

        {/* Rooms with photos */}
        <div className="space-y-6 min-w-0">
          {photos.length === 0 && (
            <EmptyState title="Nenhuma foto salva para este apartamento"
              action={supportsImport ? <Button variant="primary" icon={<CloudDownload size={16} />} busy={busy === 'current'} onClick={() => importFromAirbnb('current')}>Buscar fotos atuais no Airbnb</Button> : undefined}>
              Busque as fotos do anúncio no Airbnb (elas ficam guardadas no site) ou arraste arquivos aqui.
            </EmptyState>
          )}
          {rooms.filter((r) => (byRoom.get(r)?.length || 0) > 0 || extraRooms.includes(r) || (r === '' && photos.length > 0)).map((room) => {
            const list = byRoom.get(room) || [];
            const key = `room:${room}`;
            return (
              <section key={room || 'none'} id={`room-${encodeURIComponent(room || 'none')}`} aria-label={roomLabel(room)}
                onDragOver={(e) => allowDrop(e, key)} onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropTarget(null); }}
                onDrop={(e) => onDrop(e, room)}
                className={`rounded-2xl p-4 -m-4 transition-colors scroll-mt-24 ${dropTarget === key ? 'bg-ad-accent-soft/70 ring-2 ring-ad-accent/40' : ''}`}>
                <SectionHeading
                  title={`${roomLabel(room)}${room && roomLabel(room) !== room ? ` · ${room}` : ''}`}
                  description={room === '' ? 'Fotos sem cômodo aparecem no fim do Photo Tour, em "Property". Arraste cada uma para o cômodo certo.' : undefined}
                  actions={<>
                    <span className="text-xs text-ad-faint">{list.length} foto(s)</span>
                    <Button size="sm" variant="ghost" onClick={() => { uploadRoom.current = room; fileInput.current?.click(); }}>Enviar aqui</Button>
                  </>} />
                {list.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-ad-line-strong py-8 text-center text-sm text-ad-faint">Solte fotos aqui</div>
                ) : (
                  <ul className="grid gap-3 grid-cols-2 sm:grid-cols-3 xl:grid-cols-4">
                    {list.map((photo) => (
                      <li key={photo.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, photo)}
                        onDragOver={(e) => allowDrop(e, `before:${photo.id}`)}
                        onDrop={(e) => onDrop(e, room, photo.id)}
                        className={`group relative rounded-xl bg-ad-panel border overflow-hidden transition-[box-shadow,transform,opacity] duration-200 cursor-grab active:cursor-grabbing
                          ${dropTarget === `before:${photo.id}` ? 'border-ad-accent shadow-[-6px_0_0_0_var(--color-ad-accent)]' : 'border-ad-line/80'}
                          ${dragging === photo.id ? 'opacity-40' : ''} ${selected.has(photo.id) ? 'ring-2 ring-ad-ink' : ''}`}>
                        <div className="relative aspect-[4/3] bg-ad-sunken">
                          {broken.has(photo.id) ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-3 text-center text-ad-danger">
                              <TriangleAlert size={20} aria-hidden="true" />
                              <span className="text-xs font-medium">Esta foto não existe mais no Airbnb</span>
                            </div>
                          ) : (
                            <img src={photo.url} alt={photo.alt || ''} loading="lazy" referrerPolicy="no-referrer" draggable={false}
                              onError={() => setBroken((b) => new Set(b).add(photo.id))}
                              className={`absolute inset-0 w-full h-full object-cover ${photo.hidden ? 'opacity-40 grayscale' : ''}`} />
                          )}
                          <button type="button" aria-label={selected.has(photo.id) ? 'Desmarcar foto' : 'Selecionar foto'} onClick={() => toggleSelect(photo.id)}
                            className={`absolute top-2 left-2 w-6 h-6 rounded-md border flex items-center justify-center transition
                              ${selected.has(photo.id) ? 'bg-ad-ink border-ad-ink text-white' : 'bg-white/90 border-ad-line-strong text-transparent opacity-0 group-hover:opacity-100 focus:opacity-100'}`}>
                            <Check size={14} />
                          </button>
                          <div className="absolute top-2 right-2 flex gap-1">
                            {photo.isPrimary && <Badge tone="accent" className="bg-white/95"><Star size={11} fill="currentColor" /> Capa</Badge>}
                            {photo.hidden && <Badge className="bg-white/95">Oculta</Badge>}
                            {photo.stored === false && !broken.has(photo.id) && <Badge tone="warn" className="bg-white/95">Link</Badge>}
                          </div>
                          <GripVertical size={16} className="absolute bottom-2 left-2 text-white drop-shadow opacity-0 group-hover:opacity-100" aria-hidden="true" />
                        </div>
                        <div className="flex items-center gap-1 p-2">
                          <select aria-label="Cômodo da foto" value={photo.roomCategory || ''}
                            onChange={(e) => { const r = pickRoom(e.target.value); if (r || e.target.value === '') moveTo([photo.id], r); }}
                            className="min-w-0 flex-1 h-8 rounded-md border border-ad-line bg-ad-panel px-2 text-[13px] text-ad-ink focus:outline-none focus:ring-2 focus:ring-ad-accent/30">
                            {roomOptions}
                          </select>
                          <button type="button" title="Usar como capa" aria-label="Usar como capa" disabled={photo.isPrimary || busy === photo.id} onClick={() => setCover(photo)}
                            className="h-8 w-8 rounded-md flex items-center justify-center text-ad-muted hover:bg-ad-sunken hover:text-ad-accent disabled:opacity-30"><Star size={15} /></button>
                          <button type="button" title={photo.hidden ? 'Mostrar no site' : 'Ocultar do site'} aria-label={photo.hidden ? 'Mostrar no site' : 'Ocultar do site'}
                            onClick={() => setHidden([photo.id], !photo.hidden)}
                            className="h-8 w-8 rounded-md flex items-center justify-center text-ad-muted hover:bg-ad-sunken hover:text-ad-ink">{photo.hidden ? <Eye size={15} /> : <EyeOff size={15} />}</button>
                          <button type="button" title="Excluir" aria-label="Excluir foto" onClick={() => setToDelete([photo])}
                            className="h-8 w-8 rounded-md flex items-center justify-center text-ad-muted hover:bg-ad-danger-soft hover:text-ad-danger"><Trash2 size={15} /></button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}

          {notImported.length > 0 && photos.length > 0 && (
            <Card>
              <SectionHeading title="Fotos antigas do Airbnb (não salvas)"
                description="Estas fotos vieram de uma leitura antiga do anúncio e não fazem parte da galeria acima. Muitas já foram trocadas no Airbnb. Para atualizar, use “Buscar fotos atuais no Airbnb”." />
              <p className="text-sm text-ad-muted">{notImported.length} foto(s) — não aparecem no site enquanto houver fotos salvas acima.</p>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={toDelete !== null}
        title={toDelete && toDelete.length > 1 ? `Excluir ${toDelete.length} fotos?` : 'Excluir esta foto?'}
        message="A foto sai do site e a cópia guardada é apagada. Não dá para desfazer."
        confirmLabel="Excluir"
        onConfirm={() => { if (toDelete) removePhotos(toDelete); }}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
