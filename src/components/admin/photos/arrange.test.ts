import { describe, it, expect } from 'vitest';
import { arrangePayload, movePhotos, sortPhotos } from './arrange';
import { roomLabel, suggestedRooms } from './roomCategories';

const P = (id: string, room: string | null, order: number) => ({ id, roomCategory: room, displayOrder: order, hidden: false });
const rooms = ['', 'Living room', 'Kitchen', 'Bedroom'];
const ids = (list: { id: string }[]) => list.map((p) => p.id);

describe('photo arrangement', () => {
  it('saves photos without a room last, so the Photo Tour starts with real rooms', () => {
    const photos = [P('a', null, 0), P('b', 'Kitchen', 1), P('c', 'Living room', 2)];
    expect(ids(sortPhotos(photos, rooms))).toEqual(['c', 'b', 'a']);
    expect(arrangePayload(photos, rooms).map((p) => [p.id, p.displayOrder])).toEqual([['c', 0], ['b', 1], ['a', 2]]);
  });

  it('dropping on a photo inserts before it', () => {
    const photos = [P('k1', 'Kitchen', 0), P('k2', 'Kitchen', 1), P('x', null, 2)];
    const out = movePhotos(photos, rooms, ['x'], 'Kitchen', 'k2');
    expect(ids(out)).toEqual(['k1', 'x', 'k2']);
    expect(out.find((p) => p.id === 'x')!.roomCategory).toBe('Kitchen');
  });

  it('dropping on a room appends to the end of that room', () => {
    const photos = [P('l1', 'Living room', 0), P('k1', 'Kitchen', 1), P('x', null, 2), P('y', null, 3)];
    expect(ids(movePhotos(photos, rooms, ['y', 'x'], 'Living room'))).toEqual(['l1', 'x', 'y', 'k1']);
  });

  it('reorders inside the same room', () => {
    const photos = [P('k1', 'Kitchen', 0), P('k2', 'Kitchen', 1), P('k3', 'Kitchen', 2)];
    expect(ids(movePhotos(photos, rooms, ['k3'], 'Kitchen', 'k1'))).toEqual(['k3', 'k1', 'k2']);
  });

  it('moving back to "no room" keeps the photo and clears its room', () => {
    const out = movePhotos([P('k1', 'Kitchen', 0)], rooms, ['k1'], '');
    expect(out[0]).toMatchObject({ id: 'k1', roomCategory: null });
  });

  it('custom rooms (not in the list) sort before "no room"', () => {
    const photos = [P('a', null, 0), P('t', 'Rooftop', 1), P('k', 'Kitchen', 2)];
    expect(ids(sortPhotos(photos, rooms))).toEqual(['k', 't', 'a']);
  });
});

describe('rooms', () => {
  it('suggests rooms from the apartment layout', () => {
    expect(suggestedRooms({ bedrooms: 2, bathrooms: 1 })).toEqual(expect.arrayContaining(['Bedroom 1', 'Bedroom 2', 'Bathroom']));
    expect(suggestedRooms({ bedrooms: 1, bathrooms: 2, ensuiteBathrooms: 1 })).toEqual(expect.arrayContaining(['Bedroom', 'Bathroom 1', 'Bathroom 2', 'Ensuite bathroom']));
  });

  it('shows Portuguese labels in the admin', () => {
    expect(roomLabel('Kitchen')).toBe('Cozinha');
    expect(roomLabel('Bedroom 2')).toBe('Quarto 2');
    expect(roomLabel('')).toBe('Sem cômodo');
    expect(roomLabel('Rooftop')).toBe('Rooftop');
  });
});
