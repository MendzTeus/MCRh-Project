import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import { signToken } from '../auth.js';

const ORIGINAL_SECRET = process.env.ADMIN_JWT_SECRET;

beforeEach(() => {
  process.env.ADMIN_JWT_SECRET = 'test-secret-do-not-use-in-prod';
});

afterEach(() => {
  process.env.ADMIN_JWT_SECRET = ORIGINAL_SECRET;
});

// These hit `requireAdmin` (a synchronous, in-process check) before any handler
// touches Supabase, so no live DB connection is needed to exercise the auth gate.
// 1.15 only asserts the gate is passed (not a 401/403) — it doesn't assert on
// downstream DB behaviour, which is out of scope for this auth-focused suite.
describe('Task 1.13 — unauthenticated access to /api/admin/*', () => {
  it('rejects GET /api/admin/units with 401 when no token is sent', async () => {
    const res = await request(app).get('/api/admin/units');
    expect(res.status).toBe(401);
  });

  it('rejects GET /api/admin/leads with 401 when no token is sent', async () => {
    const res = await request(app).get('/api/admin/leads');
    expect(res.status).toBe(401);
  });

  it('rejects PATCH /api/admin/units/some-slug with 401 when no token is sent', async () => {
    const res = await request(app).patch('/api/admin/units/some-slug').send({});
    expect(res.status).toBe(401);
  });

  it('rejects POST /api/admin/units/some-slug/photos (upload) with 401 when no token is sent — Task 5.14', async () => {
    const res = await request(app)
      .post('/api/admin/units/some-slug/photos')
      .send({ dataBase64: 'AAAA', contentType: 'image/jpeg' });
    expect(res.status).toBe(401);
  });
});

describe('Task 1.14 — authenticated non-admin (invalid/wrong-role token) access', () => {
  it('rejects with 401 when the token role is not admin', async () => {
    const token = signToken({ role: 'guest' });
    const res = await request(app)
      .get('/api/admin/units')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  it('rejects with 401 when the token is signed with a different secret', async () => {
    const token = signToken({ role: 'admin' });
    process.env.ADMIN_JWT_SECRET = 'a-different-secret';
    const res = await request(app)
      .get('/api/admin/units')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  it('rejects with 401 on a malformed Authorization header', async () => {
    const res = await request(app)
      .get('/api/admin/units')
      .set('Authorization', 'NotBearer garbage');
    expect(res.status).toBe(401);
  });
});

describe('Task 1.15 — authorised admin access', () => {
  it('passes the requireAdmin gate (does not return 401) for a valid admin token', async () => {
    const token = signToken({ role: 'admin' });
    const res = await request(app)
      .get('/api/admin/units')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).not.toBe(401);
  });
});
