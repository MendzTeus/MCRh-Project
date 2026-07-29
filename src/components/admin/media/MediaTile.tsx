import type { DragEvent } from 'react';
import { getMediaKey, type MediaItem, type MediaOwner } from './types';

const GOLD = '#C5A059';
const actionClass = 'flex-1 text-white/80 text-[11px] leading-none py-1 hover:text-[#C5A059] transition-colors disabled:opacity-25 disabled:hover:text-white/80';

type MediaTileProps = {
  owner: MediaOwner;
  item: MediaItem;
  index: number;
  total: number;
  categories?: readonly string[];
  variant?: 'editor' | 'preview';
  draggable?: boolean;
  pending?: boolean;
  selected?: boolean;
  selectable?: boolean;
  onToggleSelected?: (owner: MediaOwner, item: MediaItem) => void;
  onDragStart?: (owner: MediaOwner, item: MediaItem, event: DragEvent<HTMLDivElement>) => void;
  onDragEnd?: (owner: MediaOwner, item: MediaItem) => void;
  onMove?: (owner: MediaOwner, item: MediaItem, direction: -1 | 1) => void;
  onCategoryChange?: (owner: MediaOwner, item: MediaItem, category: string) => void;
  onToggleHidden?: (owner: MediaOwner, item: MediaItem) => void;
  onSetPrimary?: (owner: MediaOwner, item: MediaItem) => void;
  onEditAlt?: (owner: MediaOwner, item: MediaItem) => void;
  onDelete?: (owner: MediaOwner, item: MediaItem) => void;
};

export function MediaTile({
  owner,
  item,
  index,
  total,
  categories = [],
  variant = 'editor',
  draggable = false,
  pending = false,
  selected = false,
  selectable = false,
  onToggleSelected,
  onDragStart,
  onDragEnd,
  onMove,
  onCategoryChange,
  onToggleHidden,
  onSetPrimary,
  onEditAlt,
  onDelete,
}: MediaTileProps) {
  if (variant === 'preview') {
    return (
      <div className={`relative group ${item.hidden ? 'opacity-40' : ''}`} data-media-key={getMediaKey(item)}>
        <img src={item.url} alt={item.alt || ''} referrerPolicy="no-referrer" className="w-20 h-20 object-cover rounded" />
        {item.isPrimary && (
          <div
            className="absolute top-0.5 left-0.5 font-body text-[7px] uppercase tracking-widest text-white px-1 py-0.5 rounded"
            style={{ background: GOLD }}
          >
            Capa
          </div>
        )}
        {item.hidden && (
          <div className="absolute inset-x-0 bottom-0 font-body text-[7px] uppercase tracking-widest text-center text-white bg-red-700/80 py-0.5">
            Oculto
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 w-full" data-media-key={getMediaKey(item)}>
      <div
        draggable={draggable}
        onDragStart={(event) => onDragStart?.(owner, item, event)}
        onDragEnd={() => onDragEnd?.(owner, item)}
        className={`relative shrink-0 overflow-hidden rounded-xl shadow-md aspect-[4/3] select-none transition-opacity ${
          draggable ? 'cursor-grab active:cursor-grabbing' : ''
        } ${pending ? 'opacity-60' : item.hidden ? 'opacity-40' : ''}`}
        style={{
          border: `${selected || item.isPrimary ? 2 : 1}px solid ${
            selected ? GOLD : item.isPrimary ? GOLD : item.hidden ? 'rgba(186,26,26,0.5)' : 'rgba(197,198,205,0.4)'
          }`,
          boxShadow: selected ? '0 0 0 2px rgba(197,160,89,0.5) inset' : undefined,
        }}
      >
        {selectable && onToggleSelected && (
          <label className="absolute top-1 left-1 z-20 flex items-center justify-center w-5 h-5 rounded bg-black/40 cursor-pointer">
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onToggleSelected(owner, item)}
              className="accent-[#C5A059]"
              aria-label={`Selecionar foto ${item.alt || ''}`.trim()}
            />
          </label>
        )}
        {item.isPrimary && (
          <div
            className="absolute top-1 right-1 z-10 font-body text-[8px] uppercase tracking-widest text-white px-1.5 py-0.5 rounded"
            style={{ background: GOLD }}
          >
            Capa
          </div>
        )}
        {pending && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/25">
            <span className="font-body text-[9px] uppercase tracking-widest text-white">salvando…</span>
          </div>
        )}
        {item.hidden && !pending && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <span className="font-body text-[9px] uppercase tracking-widest text-white bg-red-700/80 px-2 py-0.5 rounded">
              Oculto
            </span>
          </div>
        )}
        <img
          src={item.url}
          alt={item.alt || ''}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute bottom-0 left-0 right-0 flex z-20" style={{ background: 'rgba(16,28,45,0.78)' }}>
          {onMove && (
            <>
              <button
                onClick={() => onMove(owner, item, -1)}
                disabled={index === 0 || pending}
                title="Mover para a esquerda"
                aria-label="Mover para a esquerda"
                className={actionClass}
              >
                ◀
              </button>
              <button
                onClick={() => onMove(owner, item, 1)}
                disabled={index === total - 1 || pending}
                title="Mover para a direita"
                aria-label="Mover para a direita"
                className={actionClass}
              >
                ▶
              </button>
            </>
          )}
          {onSetPrimary && item.id && (
            <button
              onClick={() => onSetPrimary(owner, item)}
              disabled={pending || item.isPrimary}
              title="Definir como capa"
              aria-label="Definir como capa"
              className={actionClass}
              style={{ color: item.isPrimary ? GOLD : undefined }}
            >
              ★
            </button>
          )}
          {onEditAlt && item.id && (
            <button
              onClick={() => onEditAlt(owner, item)}
              disabled={pending}
              title="Editar texto alternativo"
              aria-label="Editar texto alternativo"
              className={actionClass}
            >
              ✎
            </button>
          )}
          {onDelete && item.id && (
            <button
              onClick={() => onDelete(owner, item)}
              disabled={pending}
              title="Excluir foto"
              aria-label="Excluir foto"
              className={`${actionClass} hover:text-red-300`}
            >
              🗑
            </button>
          )}
        </div>
      </div>

      {onCategoryChange && (
        <select
          value={item.roomCategory || ''}
          onChange={(event) => onCategoryChange(owner, item, event.target.value)}
          disabled={pending}
          className="w-full bg-surface border border-outline-variant/30 font-body text-[10px] text-on-surface-variant focus:outline-none focus:border-[#C5A059] py-1 px-1.5 rounded-sm cursor-pointer"
          aria-label="Categoria da foto"
        >
          <option value="">— sem categoria —</option>
          {categories.map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
      )}

      {onToggleHidden && (
        <button
          onClick={() => onToggleHidden(owner, item)}
          disabled={pending}
          className="w-full font-body text-[9px] uppercase tracking-[0.12em] py-1 transition-colors disabled:opacity-40"
          style={{ color: item.hidden ? '#ba1a1a' : 'rgba(0,0,0,0.35)' }}
        >
          {item.hidden ? '● Oculto do tour' : '○ Ocultar do tour'}
        </button>
      )}
    </div>
  );
}
