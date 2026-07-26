import { describe, it, expect, beforeAll } from 'vitest';

// server/admin.js pulls in server/db.js, which creates a Supabase client at
// import time and throws if SUPABASE_URL/SUPABASE_SERVICE_KEY aren't set —
// stub them before importing so this MIME/size-only unit test doesn't need a
// real Supabase project.
let validatePhotoUpload;
beforeAll(async () => {
  process.env.SUPABASE_URL ||= 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_KEY ||= 'test-key';
  ({ validatePhotoUpload } = await import('../admin.js'));
});

function mockRes() {
  const res = {};
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (body) => { res.body = body; return res; };
  return res;
}

describe('Task 5.9/5.10/5.16 — validatePhotoUpload (MIME + size checks)', () => {
  it('accepts a small, allowlisted image type', () => {
    const res = mockRes();
    const ok = validatePhotoUpload('image/jpeg', Buffer.alloc(1024), res);
    expect(ok).toBe(true);
  });

  it('rejects a non-image MIME type with 400', () => {
    const res = mockRes();
    const ok = validatePhotoUpload('text/html', Buffer.alloc(1024), res);
    expect(ok).toBe(false);
    expect(res.statusCode).toBe(400);
  });

  it('rejects an svg (script-capable) MIME type with 400', () => {
    const res = mockRes();
    const ok = validatePhotoUpload('image/svg+xml', Buffer.alloc(1024), res);
    expect(ok).toBe(false);
    expect(res.statusCode).toBe(400);
  });

  it('rejects a file over the size cap with 400', () => {
    const res = mockRes();
    const ok = validatePhotoUpload('image/png', Buffer.alloc(9 * 1024 * 1024), res);
    expect(ok).toBe(false);
    expect(res.statusCode).toBe(400);
  });
});
