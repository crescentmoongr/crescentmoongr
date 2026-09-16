import { env } from 'cloudflare:workers';

const COOKIE = 'cm_reader_session';
const UNLOCK_COOKIE_PREFIX = 'cm_unlock_';
const UNLOCK_TTL = 48 * 60 * 60;
let cachedKey: CryptoKey | null = null;
let cachedUnlockKey: CryptoKey | null = null;

function b64url(bytes: Uint8Array) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
function decodeB64url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
  const bin = atob(padded);
  return Uint8Array.from(bin, ch => ch.charCodeAt(0));
}
function randomToken(bytes = 24) {
  const a = new Uint8Array(bytes); crypto.getRandomValues(a); return b64url(a);
}
function secretSeed() {
  const seed = String(env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_PUBLISHABLE_KEY || '');
  if (!seed) throw new Error('Thiếu khóa ký trang đọc.');
  return seed;
}
async function signingKey() {
  if (cachedKey) return cachedKey;
  const raw = `crescent-reader-page-v2:${secretSeed()}`;
  cachedKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(raw), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign','verify']);
  return cachedKey;
}
async function unlockSigningKey() {
  if (cachedUnlockKey) return cachedUnlockKey;
  const raw = `crescent-series-unlock-v1:${secretSeed()}`;
  cachedUnlockKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(raw), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign','verify']);
  return cachedUnlockKey;
}
async function shortSeriesKey(seriesId: string) {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(seriesId)));
  return b64url(digest.slice(0, 12));
}
async function unlockCookieName(seriesId: string) {
  return `${UNLOCK_COOKIE_PREFIX}${await shortSeriesKey(seriesId)}`;
}
export function ensureReaderSession(cookies: any) {
  let id = cookies.get(COOKIE)?.value || '';
  if (!/^[A-Za-z0-9_-]{20,80}$/.test(id)) {
    id = randomToken(24);
    cookies.set(COOKIE, id, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: UNLOCK_TTL });
  }
  return id;
}
export function getReaderSession(cookies: any) {
  const id = cookies.get(COOKIE)?.value || '';
  return /^[A-Za-z0-9_-]{20,80}$/.test(id) ? id : '';
}

// v12.07: password unlock state is a signed, HttpOnly 48-hour cookie.
// Normal chapter reads therefore do not perform Workers KV reads.
export async function markSeriesUnlocked(cookies: any, seriesId: string) {
  const exp = Math.floor(Date.now() / 1000) + UNLOCK_TTL;
  const payload = `${seriesId}.${exp}`;
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', await unlockSigningKey(), new TextEncoder().encode(payload)));
  cookies.set(await unlockCookieName(seriesId), `${exp}.${b64url(sig)}`, {
    httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: UNLOCK_TTL
  });
}
export async function isSeriesUnlocked(cookies: any, seriesId: string) {
  const raw = cookies.get(await unlockCookieName(seriesId))?.value || '';
  const [ts, sig] = raw.split('.');
  const exp = Number(ts || '0');
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(exp) || !sig || exp <= now || exp > now + UNLOCK_TTL + 60) return false;
  try {
    return await crypto.subtle.verify(
      'HMAC', await unlockSigningKey(), decodeB64url(sig), new TextEncoder().encode(`${seriesId}.${exp}`)
    );
  } catch { return false; }
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
  try {
    return await crypto.subtle.verify('HMAC', await signingKey(), decodeB64url(signature), new TextEncoder().encode(payload));
  } catch { return false; }
}
