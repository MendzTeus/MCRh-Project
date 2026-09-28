import { describe, it, expect } from 'vitest';
import { applyPropertyContent, unitMapLocations } from './propertyContent';
import { getPropertyBySlug } from '../data/properties';
import { buildMapLocations } from '../data/locations';

const ancoats = getPropertyBySlug('ancoats')!;

describe('applyPropertyContent', () => {
  it('returns the built-in data untouched when there is no row or only NULLs', () => {
    expect(applyPropertyContent(ancoats, undefined)).toEqual(ancoats);
    expect(applyPropertyContent(ancoats, { headline: null, amenities: null, nearby: null, maxGuests: null })).toEqual(ancoats);
  });

  it('applies headline, amenities, distances and specs from the Property row', () => {
    const out = applyPropertyContent(ancoats, {
      headline: 'New headline',
      amenities: ['Gym', 'Parking'],
      nearby: [{ location: 'Piccadilly', time: '5 min walk' }],
      maxGuests: 6, bedrooms: 3, beds: 0, bathrooms: null,
    });
    expect(out.headline).toBe('New headline');
    expect(out.amenities).toEqual(['Gym', 'Parking']);
    expect(out.distances).toEqual([{ location: 'Piccadilly', time: '5 min walk' }]);
    expect(out.maxGuests).toBe(6);
    expect(out.bedrooms).toBe(3);
    expect(out.beds).toBe(ancoats.beds);        // 0 = not set
    expect(out.bathrooms).toBe(ancoats.bathrooms);
  });

  it('accepts amenities stored as { item } objects too', () => {
    expect(applyPropertyContent(ancoats, { amenities: [{ item: 'Gym' }] }).amenities).toEqual(['Gym']);
  });

  it('ignores blank values so a half-filled form never blanks the page', () => {
    const out = applyPropertyContent(ancoats, {
      headline: '   ',
      amenities: [''],
      nearby: [{ location: 'Somewhere', time: '' }],
    });
    expect(out.headline).toBe(ancoats.headline);
    expect(out.amenities).toEqual(ancoats.amenities);
    expect(out.distances).toEqual(ancoats.distances);
  });
});

describe('unitMapLocations', () => {
  const locations = buildMapLocations({ '7': { lat: 53.5, lng: -2.2 } }); // Loom Street overridden in admin

  it('shows only the apartment building, not every building of the collection', () => {
    const out = unitMapLocations({ collectionSlug: 'ancoats', buildingSlug: 'loom-street', locations });
    expect(out.map((l) => l.collectionSlug)).toEqual(['loom-street']);
  });

  it('uses the admin map-pin override for the building', () => {
    const [pin] = unitMapLocations({ collectionSlug: 'ancoats', buildingSlug: 'loom-street', locations });
    expect(pin.coordinates).toEqual({ lat: 53.5, lng: -2.2 });
  });

  it("prefers the apartment's own saved coordinates", () => {
    const [pin] = unitMapLocations({
      collectionSlug: 'ancoats', buildingSlug: 'loom-street', locations,
      unitCoords: { latitude: 53.4801, longitude: -2.2301 },
    });
    expect(pin.coordinates).toEqual({ lat: 53.4801, lng: -2.2301 });
  });

  it('ignores incomplete coordinates', () => {
    const [pin] = unitMapLocations({
      collectionSlug: 'ancoats', buildingSlug: 'loom-street', locations,
      unitCoords: { latitude: 53.4801, longitude: null },
    });
    expect(pin.coordinates).toEqual({ lat: 53.5, lng: -2.2 });
  });

  it('maps the Chambers buildings to their own pin', () => {
    const out = unitMapLocations({ collectionSlug: 'chambers', buildingSlug: 'chambers-11', locations });
    expect(out.map((l) => l.name)).toEqual(['11 Chapel Walks']);
  });

  it('falls back to the collection pins when the building has no location', () => {
    const out = unitMapLocations({ collectionSlug: 'john-dalton-st', buildingSlug: undefined, locations });
    expect(out.map((l) => l.collectionSlug)).toEqual(['john-dalton-st']);
  });
});
