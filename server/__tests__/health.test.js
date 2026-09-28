import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index.js';

describe('GET /api/health', () => {
  it('answers ok without touching the database', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('reports 503 in deep mode when the database cannot be reached', async () => {
    // The test env points SUPABASE_URL at a placeholder host, so the deep
    // check must fail closed rather than claim the database is healthy.
    const res = await request(app).get('/api/health?deep=1');
    expect(res.status).toBe(503);
    expect(res.body.ok).toBe(false);
  }, 20000);
});
