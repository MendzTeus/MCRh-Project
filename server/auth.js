// Minimal signed-token auth for the operational admin.
// A single shared password (ADMIN_PASSWORD) is exchanged for an HMAC-signed
// token (ADMIN_JWT_SECRET). No external deps, no email flow — easy to swap for
// Supabase Auth magic links later without touching the route handlers.
const crypto = require('crypto');

const WEEK = 1000 * 60 * 60 * 24 * 7;
const b64u = (s) => Buffer.from(s).toString('base64url');

function signToken(payload = {}) {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) throw new Error('ADMIN_JWT_SECRET not set');
  const body = b64u(JSON.stringify({ ...payload, exp: Date.now() + WEEK }));
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifyToken(token) {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!token || !secret) return null;
  const [body, sig] = String(token).split('.');
  if (!body || !sig) return null;
  const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (!payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

// Express middleware — rejects unless a valid admin token is present.
function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.admin = payload;
  next();
}

module.exports = { signToken, verifyToken, requireAdmin };
