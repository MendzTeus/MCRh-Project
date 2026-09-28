import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRequire } from 'node:module';
import request from 'supertest';
import app from '../index.js';
import { signToken } from '../auth.js';

const require = createRequire(import.meta.url);
const { supabase } = require('../db.js');
const { normalizeLeadStatus, storedValuesFor } = require('../leads.js');

// Minimal chainable stand-in for the Supabase query builder: records every
// call and resolves to `result` when awaited.
function fakeQuery(result, calls) {
  const q = new Proxy({}, {
    get(_, prop) {
      if (prop === 'then') return (resolve) => resolve(result);
      return (...args) => { calls.push([prop, ...args]); return q; };
    },
  });
  return q;
}

let calls;
let originalFrom;
let nextResult;
let ip = 0;

beforeEach(() => {
  calls = [];
  nextResult = { data: null, error: null };
  originalFrom = supabase.from;
  supabase.from = (table) => { calls.push(['from', table]); return fakeQuery(nextResult, calls); };
  process.env.ADMIN_JWT_SECRET = 'test-secret-do-not-use-in-prod';
});

afterEach(() => {
  supabase.from = originalFrom;
});

// Each test uses its own client IP so the per-IP enquiry throttle doesn't
// leak between tests.
const post = (path, body) => request(app).post(path).set('X-Real-IP', `10.9.0.${++ip}`).send(body);

describe('lead status vocabulary', () => {
  it('maps legacy Portuguese values to the canonical ones', () => {
    expect(normalizeLeadStatus('novo')).toBe('new');
    expect(normalizeLeadStatus('lido')).toBe('contacted');
    expect(normalizeLeadStatus('arquivado')).toBe('closed');
    expect(normalizeLeadStatus('contacted')).toBe('contacted');
  });

  it('treats unknown or empty values as new, so no lead drops out of the queue', () => {
    expect(normalizeLeadStatus(null)).toBe('new');
    expect(normalizeLeadStatus('whatever')).toBe('new');
  });

  it('lists every stored value that means a status', () => {
    expect(storedValuesFor('new')).toEqual(['new', 'novo']);
    expect(storedValuesFor('closed')).toEqual(['closed', 'arquivado']);
  });
});

describe('public enquiry submission', () => {
  const valid = { name: 'Jane Doe', email: 'jane@example.com', message: 'Hi', propertyName: 'Chambers', source: 'contact-form' };

  it('saves a valid enquiry at /api/enquiries (the URL the contact form uses)', async () => {
    const res = await post('/api/enquiries', valid);
    expect(res.status).toBe(201);
    const insert = calls.find(([op]) => op === 'insert');
    expect(insert).toBeTruthy();
    expect(insert[1]).toMatchObject({ name: 'Jane Doe', email: 'jane@example.com', propertyName: 'Chambers', status: 'new' });
  });

  it('writes the unit to the real (lower-case) unitslug column', async () => {
    await post('/api/enquiries', { ...valid, unitSlug: 'chambers-9-1' });
    const insert = calls.find(([op]) => op === 'insert');
    expect(insert[1].unitslug).toBe('chambers-9-1');
    expect(insert[1]).not.toHaveProperty('unitSlug');
  });

  it('saves a valid enquiry at /api/content/enquiries too', async () => {
    const res = await post('/api/content/enquiries', valid);
    expect(res.status).toBe(201);
  });

  it('rejects invalid optional fields and never writes them', async () => {
    const res = await post('/api/enquiries', { ...valid, guests: 'lots' });
    expect(res.status).toBe(400);
    expect(calls.find(([op]) => op === 'insert')).toBeUndefined();
  });

  it('does not leak database errors to the public', async () => {
    nextResult = { data: null, error: { message: 'relation "Enquiry" violates something internal' } };
    const res = await post('/api/enquiries', valid);
    expect(res.status).toBe(500);
    expect(res.body.error).not.toMatch(/relation/);
  });
});

describe('admin leads API', () => {
  const auth = () => `Bearer ${signToken({ role: 'admin' })}`;

  it('returns legacy statuses in the canonical vocabulary', async () => {
    nextResult = { data: [{ id: 'a', status: 'novo' }, { id: 'b', status: 'lido' }, { id: 'c', status: 'closed' }], error: null };
    const res = await request(app).get('/api/admin/leads').set('Authorization', auth());
    expect(res.status).toBe(200);
    expect(res.body.map((l) => l.status)).toEqual(['new', 'contacted', 'closed']);
  });

  it('exposes the unitslug column as unitSlug', async () => {
    nextResult = { data: [{ id: 'a', status: 'new', unitslug: 'chambers-9-1' }], error: null };
    const res = await request(app).get('/api/admin/leads').set('Authorization', auth());
    expect(res.body[0].unitSlug).toBe('chambers-9-1');
    expect(res.body[0]).not.toHaveProperty('unitslug');
  });

  it('filters by status including legacy rows', async () => {
    nextResult = { data: [], error: null };
    await request(app).get('/api/admin/leads?status=new').set('Authorization', auth());
    expect(calls).toContainEqual(['in', 'status', ['new', 'novo']]);
  });

  it('only accepts canonical statuses on update', async () => {
    const bad = await request(app).patch('/api/admin/leads/a').set('Authorization', auth()).send({ status: 'novo' });
    expect(bad.status).toBe(400);

    nextResult = { data: { id: 'a', status: 'contacted' }, error: null };
    const ok = await request(app).patch('/api/admin/leads/a').set('Authorization', auth()).send({ status: 'contacted' });
    expect(ok.status).toBe(200);
    expect(calls).toContainEqual(['update', { status: 'contacted' }]);
  });
});

describe('admin content API', () => {
  const auth = () => `Bearer ${signToken({ role: 'admin' })}`;

  it('restores a key to the site default by deleting the override', async () => {
    const res = await request(app).delete('/api/admin/content/home.hero.title').set('Authorization', auth());
    expect(res.status).toBe(200);
    expect(calls).toContainEqual(['from', 'SiteContent']);
    expect(calls).toContainEqual(['delete']);
    expect(calls).toContainEqual(['eq', 'key', 'home.hero.title']);
  });

  it('requires an admin token to restore', async () => {
    const res = await request(app).delete('/api/admin/content/home.hero.title');
    expect(res.status).toBe(401);
  });
});
