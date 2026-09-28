import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRequire } from 'node:module';
import request from 'supertest';
import app from '../index.js';
import { signToken } from '../auth.js';

const require = createRequire(import.meta.url);
const { supabase } = require('../db.js');
const { validatePropertyPatch } = require('../propertyFields.js');

// Chainable Supabase stand-in; `results` is consumed one per awaited query.
function stub(results, calls) {
  supabase.from = (table) => {
    calls.push(['from', table]);
    const result = results.shift() ?? { data: null, error: null };
    const q = new Proxy({}, {
      get(_, prop) {
        if (prop === 'then') return (resolve) => resolve(result);
        return (...args) => { calls.push([prop, ...args]); return q; };
      },
    });
    return q;
  };
}

let originalFrom;
beforeEach(() => { originalFrom = supabase.from; process.env.ADMIN_JWT_SECRET = 'test-secret-do-not-use-in-prod'; });
afterEach(() => { supabase.from = originalFrom; });
const auth = () => `Bearer ${signToken({ role: 'admin' })}`;

describe('validatePropertyPatch', () => {
  it('accepts the canonical fields and turns blanks into NULL (= built-in value)', () => {
    expect(validatePropertyPatch({ headline: '  ', amenities: [' Gym ', ''], nearby: [{ location: 'A', time: '1 min' }, { location: '', time: 'x' }], beds: null }))
      .toEqual({ patch: { headline: null, amenities: ['Gym'], nearby: [{ location: 'A', time: '1 min' }], beds: null } });
    expect(validatePropertyPatch({ amenities: [] })).toEqual({ patch: { amenities: null } });
  });

  it('rejects bad input', () => {
    expect(validatePropertyPatch({ name: '' }).error).toMatch(/name/);
    expect(validatePropertyPatch({ bedrooms: 2.5 }).error).toMatch(/bedrooms/);
    expect(validatePropertyPatch({ bedrooms: 0 }).error).toMatch(/bedrooms/);
    expect(validatePropertyPatch({ amenities: 'Gym' }).error).toMatch(/amenities/);
    expect(validatePropertyPatch({ nearby: [{ location: 'A' }] }).error).toMatch(/nearby/);
    expect(validatePropertyPatch({ slug: 'x' }).error).toMatch(/No editable/);
  });
});

describe('Property API', () => {
  it('public list falls back to a select without `nearby` until migration 005 runs', async () => {
    const calls = [];
    stub([
      { data: null, error: { message: 'column Property.nearby does not exist' } },
      { data: [{ slug: 'ancoats', name: 'Ancoats' }], error: null },
    ], calls);
    const res = await request(app).get('/api/content/properties');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ slug: 'ancoats', name: 'Ancoats' }]);
    const selects = calls.filter(([op]) => op === 'select').map(([, sel]) => sel);
    expect(selects[0]).toContain('nearby');
    expect(selects[1]).not.toContain('nearby');
  });

  it('does not hide other errors behind the fallback', async () => {
    stub([{ data: null, error: { message: 'permission denied' } }], []);
    const res = await request(app).get('/api/content/properties');
    expect(res.status).toBe(500);
  });

  it('admin PATCH writes validated canonical fields', async () => {
    const calls = [];
    stub([{ data: { slug: 'wood-street', amenities: ['Smart TV'] }, error: null }], calls);
    const res = await request(app).patch('/api/admin/properties/wood-street').set('Authorization', auth())
      .send({ amenities: ['Smart TV'], maxGuests: 4, headline: '' });
    expect(res.status).toBe(200);
    const update = calls.find(([op]) => op === 'update');
    expect(update[1]).toMatchObject({ amenities: ['Smart TV'], maxGuests: 4, headline: null });
  });

  it('admin PATCH rejects invalid values without touching the database', async () => {
    const calls = [];
    stub([], calls);
    const res = await request(app).patch('/api/admin/properties/wood-street').set('Authorization', auth()).send({ maxGuests: -1 });
    expect(res.status).toBe(400);
    expect(calls.find(([op]) => op === 'update')).toBeUndefined();
  });
});
