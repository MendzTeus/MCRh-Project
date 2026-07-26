import { describe, it, expect, beforeAll } from 'vitest';

let isSafeExternalUrl;
beforeAll(async () => {
  process.env.SUPABASE_URL ||= 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_KEY ||= 'test-key';
  ({ isSafeExternalUrl } = await import('../admin.js'));
});

describe('Task 7.10 — isSafeExternalUrl (SSRF guard for server-fetched admin URLs)', () => {
  it('accepts a normal https URL', () => {
    expect(isSafeExternalUrl('https://www.airbnb.com/rooms/12345')).toBe(true);
  });

  it('rejects non-https protocols', () => {
    expect(isSafeExternalUrl('http://www.airbnb.com/rooms/12345')).toBe(false);
    expect(isSafeExternalUrl('ftp://www.airbnb.com/rooms/12345')).toBe(false);
    expect(isSafeExternalUrl('file:///etc/passwd')).toBe(false);
  });

  it('rejects localhost and .local hosts', () => {
    expect(isSafeExternalUrl('https://localhost/secret')).toBe(false);
    expect(isSafeExternalUrl('https://foo.local/secret')).toBe(false);
  });

  it('rejects private/link-local IP ranges, including the cloud metadata address', () => {
    expect(isSafeExternalUrl('https://127.0.0.1/secret')).toBe(false);
    expect(isSafeExternalUrl('https://10.0.0.5/secret')).toBe(false);
    expect(isSafeExternalUrl('https://192.168.1.1/secret')).toBe(false);
    expect(isSafeExternalUrl('https://169.254.169.254/latest/meta-data/')).toBe(false);
    expect(isSafeExternalUrl('https://172.16.0.1/secret')).toBe(false);
  });

  it('rejects malformed URLs', () => {
    expect(isSafeExternalUrl('not-a-url')).toBe(false);
  });
});
