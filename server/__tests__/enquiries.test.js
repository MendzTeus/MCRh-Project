import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index.js';

// These only assert on validation/throttle responses, which return before any
// Supabase call is made, so no live DB connection is needed to exercise them.
describe('POST /api/content/enquiries — validation', () => {
  it('rejects when name or email is missing', async () => {
    const res = await request(app).post('/api/content/enquiries').send({ name: 'Jane' });
    expect(res.status).toBe(400);
  });

  it('rejects an invalid email format', async () => {
    const res = await request(app)
      .post('/api/content/enquiries')
      .send({ name: 'Jane', email: 'not-an-email' });
    expect(res.status).toBe(400);
  });

  it('rejects an over-long message', async () => {
    const res = await request(app)
      .post('/api/content/enquiries')
      .send({ name: 'Jane', email: 'jane@example.com', message: 'x'.repeat(2001) });
    expect(res.status).toBe(400);
  });

  it('rejects an over-long name', async () => {
    const res = await request(app)
      .post('/api/content/enquiries')
      .send({ name: 'x'.repeat(201), email: 'jane@example.com' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/content/enquiries — rate limit', () => {
  it('returns 429 after exceeding the per-IP submission limit', async () => {
    // All requests here fail validation (still enough to exercise the shared
    // per-IP throttle, since it runs before validation).
    const payload = { name: 'Jane', email: 'not-an-email' };
    let lastRes;
    for (let i = 0; i < 6; i++) {
      lastRes = await request(app).post('/api/content/enquiries').send(payload);
    }
    expect(lastRes.status).toBe(429);
  });
});
