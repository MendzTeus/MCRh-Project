import { useState, type DragEvent, type ReactNode } from 'react';
import { MediaTile } from './MediaTile';
import { getMediaKey, type MediaGroup, type MediaItem, type MediaOwner } from './types';

const GOLD = '#C5A059';
const NAVY = '#101c2d';

type MediaGridProps = {
  owner: MediaOwner;
  groups: MediaGroup[];
  categories?: readonly string[];
  variant?: 'editor' | 'preview';
  pendingKeys?: ReadonlySet<string>;
  selectedKeys?: ReadonlySet<string>;
  selectable?: boolean;
  renderUpload?: (owner: MediaOwner, group: MediaGroup) => ReactNode;
  onToggleSelected?: (owner: MediaOwner, item: MediaItem) => void;
  onToggleGroupSelection?: (owner: MediaOwner, group: MediaGroup) => void;
  onMove?: (owner: MediaOwner, item: MediaItem, groupKey: string, direction: -1 | 1) => void;
  onMoveToGroup?: (owner: MediaOwner, item: MediaItem, groupKey: string) => void;
  onCategoryChange?: (owner: MediaOwner, item: MediaItem, category: string) => void;
  onToggleHidden?: (owner: MediaOwner, item: MediaItem) => void;
  onSetPrimary?: (owner: MediaOwner, item: MediaItem) => void;
  onEditAlt?: (owner: MediaOwner, item: MediaItem) => void;
  onDelete?: (owner: MediaOwner, item: MediaItem) => void;
};

export function MediaGrid({
  owner,
  groups,
  categories = [],
  variant = 'editor',
  pendingKeys = new Set<string>(),
  selectedKeys = new Set<string>(),
  selectable = false,
  renderUpload,
  onToggleSelected,
  onToggleGroupSelection,
  onMove,
  onMoveToGroup,
  onCategoryChange,
  onToggleHidden,
  onSetPrimary,
  onEditAlt,
  onDelete,
}: MediaGridProps) {
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const [dragOverGroup, setDragOverGroup] = useState<string | null>(null);

  function startDrag(item: MediaItem, event: DragEvent<HTMLDivElement>) {
    const key = getMediaKey(item);
    event.dataTransfer.setData('text/plain', key);
    event.dataTransfer.effectAllowed = 'move';
    setDraggingKey(key);
  }

  function finishDrag() {
    setDraggingKey(null);
    setDragOverGroup(null);
  }

  function dropOnGroup(groupKey: string, event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const key = event.dataTransfer.getData('text/plain');
    const item = groups.flatMap((group) => group.items).find((candidate) => getMediaKey(candidate) === key);
    setDragOverGroup(null);
    if (item) onMoveToGroup?.(owner, item, groupKey);
  }

  if (variant === 'preview') {
    return (
      <div className="space-y-8">
        {groups.map((group) => (
          <div key={group.key || '_uncat'} className="space-y-3">
            <div className="flex items-center gap-3">
              <h3
                className="font-body text-[11px] uppercase tracking-[0.15em]"
                style={{ color: group.key ? NAVY : '#92400e' }}
              >
                {group.label}
              </h3>
              <span className="font-body text-[10px] text-on-surface-variant/50">
                {group.items.length} foto{group.items.length !== 1 ? 's' : ''}
              </span>
              <div className="flex-1 h-px bg-outline-variant/20" />
            </div>
            <div className="flex flex-wrap gap-2">
              {group.items.map((item, index) => (
                <div key={getMediaKey(item)}>
                  <MediaTile
                    owner={owner}
                    item={item}
                    index={index}
                    total={group.items.length}
                    variant="preview"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => {
        const isOver = dragOverGroup === group.key;
        const allSelected = group.items.length > 0
          && group.items.every((item) => selectedKeys.has(getMediaKey(item)));

        return (
          <div
            key={group.key || '_uncat'}
            onDragOver={(event) => {
              if (!onMoveToGroup) return;
              event.preventDefault();
              setDragOverGroup(group.key);
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragOverGroup(null);
            }}
            onDrop={(event) => dropOnGroup(group.key, event)}
            className={`rounded-xl transition-all duration-150 ${
              isOver ? 'ring-2 ring-primary/50 bg-primary/5' : draggingKey ? 'ring-1 ring-outline-variant/30' : ''
            }`}
          >
            <div className="flex items-center gap-3 px-3 py-2.5">
              <h3
                className="font-body text-[11px] uppercase tracking-[0.15em]"
                style={{ color: group.key ? NAVY : '#92400e' }}
              >
                {group.label}
              </h3>
              <span className="font-body text-[10px] text-on-surface-variant/50">{group.items.length}</span>
              {selectable && group.items.length > 0 && onToggleGroupSelection && (
                <button
                  onClick={() => onToggleGroupSelection(owner, group)}
                  className="font-body text-[9px] uppercase tracking-widest text-on-surface-variant/40 hover:text-on-surface-variant transition-colors"
                >
                  {allSelected ? 'Desmarcar todas' : 'Selecionar todas'}
                </button>
              )}
              <div className="flex-1 h-px bg-outline-variant/20" />
              {draggingKey && (
                <span
                  className="font-body text-[9px] uppercase tracking-widest"
                  style={{ color: isOver ? GOLD : 'rgba(0,0,0,0.2)' }}
                >
                  {isOver ? '↓ Soltar aqui' : 'Soltar aqui'}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 px-3 pb-4 min-h-[40px]">
              {group.items.map((item, index) => {
                const key = getMediaKey(item);
                return (
                  <div key={key}>
                    <MediaTile
                      owner={owner}
                      item={item}
                      index={index}
                      total={group.items.length}
                      categories={categories}
                      draggable={Boolean(onMoveToGroup)}
                      pending={pendingKeys.has(key)}
                      selected={selectedKeys.has(key)}
                      selectable={selectable}
                      onToggleSelected={onToggleSelected}
                      onDragStart={(_, draggedItem, event) => startDrag(draggedItem, event)}
                      onDragEnd={finishDrag}
                      onMove={onMove ? (mediaOwner, movedItem, direction) => onMove(mediaOwner, movedItem, group.key, direction) : undefined}
                      onCategoryChange={onCategoryChange}
                      onToggleHidden={onToggleHidden}
                      onSetPrimary={onSetPrimary}
                      onEditAlt={onEditAlt}
                      onDelete={onDelete}
                    />
                  </div>
                );
              })}

              {group.items.length === 0 && (
                <div
                  className={`col-span-full h-16 rounded-lg flex items-center justify-center border border-dashed transition-colors ${
                    isOver ? 'border-primary/50' : 'border-outline-variant/25'
                  }`}
                >
                  <span className="font-body text-xs" style={{ color: isOver ? GOLD : 'rgba(0,0,0,0.2)' }}>
                    {isOver ? 'Soltar para adicionar' : 'Arraste fotos aqui'}
                  </span>
                </div>
              )}

              {renderUpload?.(owner, group)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
