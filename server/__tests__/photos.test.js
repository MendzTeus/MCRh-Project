import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRequire } from 'node:module';
import request from 'supertest';
import app from '../index.js';
import { signToken } from '../auth.js';

const require = createRequire(import.meta.url);
const { supabase } = require('../db.js');
const { importUnitPhotos, hideOutdatedLinks, isAirbnbImageUrl } = require('../photoImport.js');

// In-memory MediaAsset table + storage, enough for the import/arrange flows.
function fakeSupabase(rows) {
  const calls = [];
  const uploads = [];
  const table = () => {
    const state = { filters: [], op: 'select', payload: null, cols: '*' };
    const q = {
      select(cols) { if (state.op === 'select') state.cols = cols; return q; },
      eq(col, val) { state.filters.push([col, val]); return q; },
      in(col, vals) { state.filters.push([col, vals, 'in']); return q; },
      update(p) { state.op = 'update'; state.payload = p; return q; },
      insert(p) { state.op = 'insert'; state.payload = p; return q; },
      then(resolve) {
        const match = (r) => state.filters.every(([c, v, op]) => (op === 'in' ? v.includes(r[c]) : r[c] === v));
        if (state.op === 'select') {
          if (state.cols.includes('sourceUrl') && rows.noSourceUrl) return resolve({ data: null, error: { message: 'column MediaAsset.sourceUrl does not exist' } });
          return resolve({ data: rows.filter(match).map((r) => ({ ...r })), error: null });
        }
        if (state.op === 'update') { rows.filter(match).forEach((r) => Object.assign(r, state.payload)); calls.push(['update', state.payload]); return resolve({ error: null }); }
        rows.push(state.payload); calls.push(['insert', state.payload]); return resolve({ error: null });
      },
    };
    return q;
  };
  return {
    calls, uploads,
    client: {
      from: () => table(),
      storage: { from: () => ({
        upload: async (path, buf, opts) => { uploads.push({ path, size: buf.length, ...opts }); return { error: null }; },
        getPublicUrl: (path) => ({ data: { publicUrl: `https://store.example/${path}` } }),
      }) },
    },
  };
}

const img = (status = 200, type = 'image/jpeg') => async () => ({
  ok: status === 200, status,
  headers: { get: () => type },
  arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
});

const A = 'https://a0.muscache.com/im/pictures/a.jpeg';
const B = 'https://a0.muscache.com/im/pictures/b.jpeg';
const C = 'https://a0.muscache.com/im/pictures/c.jpeg';

describe('importUnitPhotos', () => {
  it('only accepts Airbnb image URLs', () => {
    expect(isAirbnbImageUrl(A)).toBe(true);
    expect(isAirbnbImageUrl('https://evil.example/a.jpg')).toBe(false);
    expect(isAirbnbImageUrl('http://a0.muscache.com/a.jpg')).toBe(false);
  });

  it('copies links in place (keeping category/order) and adds new photos at the end', async () => {
    const rows = [{ id: '1', ownerType: 'unit', ownerSlug: 'u1', url: A, storagePath: null, displayOrder: 0, roomCategory: 'Kitchen', sourceUrl: null }];
    const fake = fakeSupabase(rows);
    const out = await importUnitPhotos({ supabase: fake.client, unitSlug: 'u1', urls: [A, B], fetchImpl: img() });
    expect(out).toEqual({ imported: 2, alreadyImported: 0, failed: [] });
    expect(rows[0]).toMatchObject({ id: '1', roomCategory: 'Kitchen', sourceUrl: A, storagePath: expect.stringMatching(/^units\/u1\/airbnb-/) });
    expect(rows[1]).toMatchObject({ sourceUrl: B, displayOrder: 1, ownerSlug: 'u1' });
    expect(fake.uploads).toHaveLength(2);
  });

  it('skips photos already imported and reports ones gone from Airbnb', async () => {
    const rows = [{ id: '1', ownerType: 'unit', ownerSlug: 'u1', url: 'https://store.example/x', storagePath: 'units/u1/x', sourceUrl: A, displayOrder: 0 }];
    const fake = fakeSupabase(rows);
    const fetchImpl = async (url) => (url === C ? img(404)() : img()());
    const out = await importUnitPhotos({ supabase: fake.client, unitSlug: 'u1', urls: [A, C], fetchImpl });
    expect(out.alreadyImported).toBe(1);
    expect(out.imported).toBe(0);
    expect(out.failed).toEqual([{ url: C, error: 'não existe mais no Airbnb' }]);
  });

  it('refuses to run before migration 006', async () => {
    const rows = []; rows.noSourceUrl = true;
    await expect(importUnitPhotos({ supabase: fakeSupabase(rows).client, unitSlug: 'u1', urls: [A], fetchImpl: img() }))
      .rejects.toMatchObject({ status: 409 });
  });

  it('rejects non-image responses', async () => {
    const out = await importUnitPhotos({ supabase: fakeSupabase([]).client, unitSlug: 'u1', urls: [A], fetchImpl: img(200, 'text/html') });
    expect(out.failed[0].error).toMatch(/tipo de arquivo/);
  });
});

describe('POST /api/admin/units/:slug/photos/arrange', () => {
  let original;
  beforeEach(() => { original = supabase.from; process.env.ADMIN_JWT_SECRET = 'test-secret-do-not-use-in-prod'; });
  afterEach(() => { supabase.from = original; });
  const auth = () => `Bearer ${signToken({ role: 'admin' })}`;

  it('saves category and order for every photo of the apartment', async () => {
    const rows = [
      { id: 'p1', ownerType: 'unit', ownerSlug: 'u1', displayOrder: 0, roomCategory: null },
      { id: 'p2', ownerType: 'unit', ownerSlug: 'u1', displayOrder: 1, roomCategory: null },
    ];
    supabase.from = fakeSupabase(rows).client.from;
    const res = await request(app).post('/api/admin/units/u1/photos/arrange').set('Authorization', auth())
      .send({ items: [{ id: 'p2', roomCategory: 'Kitchen', displayOrder: 0 }, { id: 'p1', roomCategory: 'Bedroom 1', displayOrder: 1, hidden: true }] });
    expect(res.status).toBe(200);
    expect(rows.find((r) => r.id === 'p2')).toMatchObject({ roomCategory: 'Kitchen', displayOrder: 0 });
    expect(rows.find((r) => r.id === 'p1')).toMatchObject({ roomCategory: 'Bedroom 1', displayOrder: 1, hidden: true });
  });

  it('refuses photos from another apartment', async () => {
    const rows = [{ id: 'p9', ownerType: 'unit', ownerSlug: 'other', displayOrder: 0 }];
    supabase.from = fakeSupabase(rows).client.from;
    const res = await request(app).post('/api/admin/units/u1/photos/arrange').set('Authorization', auth())
      .send({ items: [{ id: 'p9', displayOrder: 0 }] });
    expect(res.status).toBe(400);
  });
});

describe('hideOutdatedLinks', () => {
  it('hides link-only photos no longer in the listing, keeps stored copies and current links', async () => {
    const rows = [
      { id: 'old', ownerType: 'unit', ownerSlug: 'u', url: A, storagePath: null, hidden: false, isPrimary: true },
      { id: 'cur', ownerType: 'unit', ownerSlug: 'u', url: B, storagePath: null, hidden: false, isPrimary: false },
      { id: 'copy', ownerType: 'unit', ownerSlug: 'u', url: 'https://store.example/x.jpg', storagePath: 'x.jpg', hidden: false, isPrimary: false },
    ];
    const fake = fakeSupabase(rows);
    const n = await hideOutdatedLinks({ supabase: fake.client, unitSlug: 'u', currentUrls: [B, C] });
    expect(n).toBe(1);
    expect(rows.find((r) => r.id === 'old')).toMatchObject({ hidden: true, isPrimary: false });
    expect(rows.find((r) => r.id === 'cur').hidden).toBe(false);
    expect(rows.find((r) => r.id === 'copy').hidden).toBe(false);
  });
});

describe('GET /api/content/units cover image', () => {
  let original;
  beforeEach(() => { original = supabase.from; });
  afterEach(() => { supabase.from = original; });

  it('never uses a hidden photo as the card cover', async () => {
    const data = {
      Unit: [{ unitSlug: 'u', unitName: 'Room 3' }],
      MediaAsset: [
        { ownerSlug: 'u', url: 'dead.jpg', isPrimary: true, hidden: true, displayOrder: 0 },
        { ownerSlug: 'u', url: 'good.jpg', isPrimary: false, hidden: false, displayOrder: 1 },
      ],
      Review: [],
    };
    supabase.from = (name) => {
      const q = new Proxy({}, {
        get: (_t, prop) => (prop === 'then'
          ? (resolve) => resolve({ data: data[name], error: null })
          : () => q),
      });
      return q;
    };
    const res = await request(app).get('/api/content/units');
    expect(res.status).toBe(200);
    expect(res.body.units[0].primaryImage).toBe('good.jpg');
  });
});
