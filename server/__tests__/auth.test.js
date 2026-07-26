import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import crypto from 'crypto';
import { signToken, verifyToken, requireAdmin } from '../auth.js';

const ORIGINAL_SECRET = process.env.ADMIN_JWT_SECRET;

beforeEach(() => {
  process.env.ADMIN_JWT_SECRET = 'test-secret-do-not-use-in-prod';
});

afterEach(() => {
  process.env.ADMIN_JWT_SECRET = ORIGINAL_SECRET;
});

describe('signToken / verifyToken', () => {
  it('round-trips a valid admin token', () => {
    const token = signToken({ role: 'admin' });
    const payload = verifyToken(token);
    expect(payload).toMatchObject({ role: 'admin' });
    expect(payload.exp).toBeGreaterThan(Date.now());
  });

  it('rejects a token signed with a different secret', () => {
    const token = signToken({ role: 'admin' });
    process.env.ADMIN_JWT_SECRET = 'a-different-secret';
    expect(verifyToken(token)).toBeNull();
  });

  it('rejects a tampered payload', () => {
    const token = signToken({ role: 'admin' });
    const [body, sig] = token.split('.');
    const tamperedBody = Buffer.from(JSON.stringify({ role: 'superadmin', exp: Date.now() + 1000 })).toString('base64url');
    expect(verifyToken(`${tamperedBody}.${sig}`)).toBeNull();
  });

  it('rejects an expired token', () => {
    const secret = process.env.ADMIN_JWT_SECRET;
    const body = Buffer.from(JSON.stringify({ role: 'admin', exp: Date.now() - 1000 })).toString('base64url');
    const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
    expect(verifyToken(`${body}.${sig}`)).toBeNull();
  });

  it('rejects malformed tokens', () => {
    expect(verifyToken('not-a-token')).toBeNull();
    expect(verifyToken('')).toBeNull();
    expect(verifyToken(null)).toBeNull();
  });

  it('returns null when ADMIN_JWT_SECRET is not set', () => {
    delete process.env.ADMIN_JWT_SECRET;
    expect(verifyToken('anything.anything')).toBeNull();
  });
});

describe('requireAdmin middleware', () => {
  function mockRes() {
    const res = {};
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (body) => { res.body = body; return res; };
    return res;
  }

  it('calls next() and attaches req.admin for a valid token', () => {
    const token = signToken({ role: 'admin' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    let called = false;
    requireAdmin(req, res, () => { called = true; });
    expect(called).toBe(true);
    expect(req.admin).toMatchObject({ role: 'admin' });
  });

  it('rejects with 401 when no Authorization header is present', () => {
    const req = { headers: {} };
    const res = mockRes();
    let called = false;
    requireAdmin(req, res, () => { called = true; });
    expect(called).toBe(false);
    expect(res.statusCode).toBe(401);
  });

  it('rejects with 401 when the token role is not admin', () => {
    const token = signToken({ role: 'guest' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    let called = false;
    requireAdmin(req, res, () => { called = true; });
    expect(called).toBe(false);
    expect(res.statusCode).toBe(401);
  });
});
