import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolveCollection, resolveUnitRoute } from './routeResolution';
import { properties, getPropertyBySlug } from '../data/properties';
import { airbnbInventory, getInventoryForProperty } from '../data/airbnbInventory';
import { mapLocations } from '../data/locations';

// Every collection/apartment URL the site itself generates (or lists in the
// sitemap) must keep resolving — the 404 must only catch genuinely bad URLs.
describe('collection URLs', () => {
  it('resolves every static collection', () => {
    for (const p of properties) expect(resolveCollection(p.slug)?.slug).toBe(p.slug);
  });

  it('resolves every map/Home location link (collectionSlug and propertySlug)', () => {
    for (const l of mapLocations) {
      expect(resolveCollection(l.collectionSlug), l.collectionSlug).toBeDefined();
      expect(resolveCollection(l.propertySlug), l.propertySlug).toBeDefined();
    }
  });

  it('resolves every inventory propertySlug (Home featured units link to these)', () => {
    for (const u of airbnbInventory) expect(resolveCollection(u.propertySlug), u.propertySlug).toBeDefined();
  });

  it('maps the Chambers buildings to the Chambers collection', () => {
    expect(resolveCollection('chambers-9')?.slug).toBe('chambers');
    expect(resolveCollection('chambers-11')?.slug).toBe('chambers');
  });

  it('keeps the legacy numeric collection ids working', () => {
    expect(resolveCollection('1')?.slug).toBe('chambers');
  });

  it('resolves every collection URL in the sitemap', () => {
    const sitemap = readFileSync(new URL('../../public/sitemap.xml', import.meta.url), 'utf8');
    const slugs = [...sitemap.matchAll(/\/collection\/([^<\s/]+)/g)].map((m) => m[1]);
    expect(slugs.length).toBeGreaterThan(0);
    for (const slug of slugs) expect(resolveCollection(slug), slug).toBeDefined();
  });

  it('rejects unknown slugs instead of falling back to Chambers', () => {
    expect(resolveCollection('does-not-exist')).toBeUndefined();
    expect(resolveCollection(undefined)).toBeUndefined();
  });
});

describe('apartment URLs', () => {
  it('accepts the links collection pages generate (inventory and static units)', () => {
    for (const p of properties) {
      for (const u of getInventoryForProperty(p.slug)) {
        expect(resolveUnitRoute(p.slug, u.unitSlug), `${p.slug}/${u.unitSlug}`).toEqual({ kind: 'ok' });
      }
      for (const u of p.units) {
        expect(resolveUnitRoute(p.slug, u.slug), `${p.slug}/${u.slug}`).toEqual({ kind: 'ok' });
      }
    }
  });

  it('accepts the links Home featured units and /properties generate', () => {
    for (const u of airbnbInventory) {
      expect(resolveUnitRoute(u.propertySlug, u.unitSlug), `${u.propertySlug}/${u.unitSlug}`).toEqual({ kind: 'ok' });
    }
  });

  it('redirects the short /property/:unitSlug form to the full URL', () => {
    const u = airbnbInventory[0];
    expect(resolveUnitRoute(undefined, u.unitSlug)).toEqual({ kind: 'redirect', to: `/properties/${u.propertySlug}/${u.unitSlug}` });
  });

  it('keeps legacy numeric unit ids working', () => {
    expect(resolveUnitRoute(undefined, '1')).toEqual({ kind: 'ok' });
  });

  it('returns not found for unknown apartments', () => {
    expect(resolveUnitRoute('chambers', 'no-such-unit')).toEqual({ kind: 'notFound' });
    expect(resolveUnitRoute('no-such-collection', 'no-such-unit')).toEqual({ kind: 'notFound' });
    expect(resolveUnitRoute(undefined, 'no-such-unit')).toEqual({ kind: 'notFound' });
  });

  it('sanity: static data resolves as before', () => {
    expect(getPropertyBySlug('ancoats')?.slug).toBe('ancoats');
  });
});
