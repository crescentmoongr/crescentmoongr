import { env } from 'cloudflare:workers';

const COOKIE = 'cm_reader_session';
let cachedKey: CryptoKey | null = null;

function b64url(bytes: Uint8Array) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
function randomToken(bytes = 24) {
  const a = new Uint8Array(bytes); crypto.getRandomValues(a); return b64url(a);
}
async function signingKey() {
  if (cachedKey) return cachedKey;
  // v12.05: signed page URLs no longer read/write KV just to obtain a key.
  // They are short-lived (5 minutes), so deriving from the existing server secret
  // is both cheaper and sufficient for these anti-hotlink signatures.
  const seed = String(env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_PUBLISHABLE_KEY || '');
  if (!seed) throw new Error('Thiếu khóa ký trang đọc.');
  const raw = `crescent-reader-page-v2:${seed}`;
  cachedKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(raw), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign','verify']);
  return cachedKey;
}
export function ensureReaderSession(cookies: any) {
  let id = cookies.get(COOKIE)?.value || '';
  if (!/^[A-Za-z0-9_-]{20,80}$/.test(id)) {
    id = randomToken(24);
    cookies.set(COOKIE, id, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 48 * 60 * 60 });
  }
  return id;
}
export function getReaderSession(cookies: any) {
  const id = cookies.get(COOKIE)?.value || '';
  return /^[A-Za-z0-9_-]{20,80}$/.test(id) ? id : '';
}
export async function markSeriesUnlocked(sessionId: string, seriesId: string) {
  await env.SESSION.put(`unlock:${sessionId}:${seriesId}`, '1', { expirationTtl: 48 * 60 * 60 });
}
export async function isSeriesUnlocked(sessionId: string, seriesId: string) {
  if (!sessionId) return false;
  return (await env.SESSION.get(`unlock:${sessionId}:${seriesId}`)) === '1';
}
export async function signPageUrl(pageId: number, seriesId: string, chapterId: string, sessionId: string, ttlSec = 300) {
  const exp = Math.floor(Date.now() / 1000) + ttlSec;
  const payload = `${pageId}.${seriesId}.${chapterId}.${sessionId}.${exp}`;
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', await signingKey(), new TextEncoder().encode(payload)));
  return `/api/page/${pageId}?e=${exp}&s=${b64url(sig)}&c=${encodeURIComponent(chapterId)}&m=${encodeURIComponent(seriesId)}`;
}
export async function verifyPageSignature(pageId: string, seriesId: string, chapterId: string, sessionId: string, exp: number, signature: string) {
  if (!sessionId || !signature || !Number.isFinite(exp) || exp < Math.floor(Date.now()/1000) || exp > Math.floor(Date.now()/1000) + 600) return false;
  const payload = `${pageId}.${seriesId}.${chapterId}.${sessionId}.${exp}`;
  const sig = signature.replace(/-/g, '+').replace(/_/g, '/');
  const padded = sig + '='.repeat((4 - sig.length % 4) % 4);
  try {
    const bin = atob(padded); const bytes = Uint8Array.from(bin, ch => ch.charCodeAt(0));
    return await crypto.subtle.verify('HMAC', await signingKey(), bytes, new TextEncoder().encode(payload));
  } catch { return false; }
}
