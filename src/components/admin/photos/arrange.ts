// Pure ordering rules for the photo manager (tested in arrange.test.ts).
//
// Saved order = room order, then the manual order inside each room. Photos
// without a room go LAST, so the public Photo Tour (which groups by saved
// order) starts with real rooms and ends with the "Property" catch-all.

export type Arrangeable = { id: string; roomCategory: string | null; displayOrder: number; hidden: boolean };

/** Rooms in saved order: known rooms first, then '' (no room) at the end. */
export function saveRoomOrder(rooms: string[]): string[] {
  return [...rooms.filter((r) => r !== ''), ''];
}

export function sortPhotos<T extends Arrangeable>(photos: T[], rooms: string[]): T[] {
  const order = saveRoomOrder(rooms);
  const rank = (p: T) => {
    const i = order.indexOf(p.roomCategory || '');
    return i === -1 ? order.length - 1.5 : i; // unknown rooms just before "no room"
  };
  return [...photos].sort((a, b) => rank(a) - rank(b) || a.displayOrder - b.displayOrder);
}

/** Renumbers displayOrder to match the sorted order. */
export function renumber<T extends Arrangeable>(photos: T[], rooms: string[]): T[] {
  return sortPhotos(photos, rooms).map((p, i) => ({ ...p, displayOrder: i }));
}

/**
 * Moves photos into `room`, before `beforeId` when given (dropped on a photo),
 * otherwise at the end of that room.
 */
export function movePhotos<T extends Arrangeable>(photos: T[], rooms: string[], ids: string[], room: string, beforeId?: string): T[] {
  const sorted = sortPhotos(photos, rooms);
  const moving = sorted.filter((p) => ids.includes(p.id)).map((p) => ({ ...p, roomCategory: room || null }));
  const rest = sorted.filter((p) => !ids.includes(p.id));
  let at = beforeId ? rest.findIndex((p) => p.id === beforeId) : -1;
  if (at === -1) {
    const lastInRoom = rest.map((p) => p.roomCategory || '').lastIndexOf(room);
    at = lastInRoom === -1 ? rest.length : lastInRoom + 1;
  }
  const next = [...rest.slice(0, at), ...moving, ...rest.slice(at)].map((p, i) => ({ ...p, displayOrder: i }));
  return renumber(next, rooms);
}

export function arrangePayload(photos: Arrangeable[], rooms: string[]) {
  return renumber(photos, rooms).map((p) => ({ id: p.id, roomCategory: p.roomCategory, displayOrder: p.displayOrder, hidden: p.hidden }));
}
