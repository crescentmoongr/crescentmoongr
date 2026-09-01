import { env } from 'cloudflare:workers';

const ACCESS_COOKIE = 'cm_access_token';
const REFRESH_COOKIE = 'cm_refresh_token';
const DEADLINE_COOKIE = 'cm_session_deadline';
const SESSION_DAYS = 30;
const SESSION_SECONDS = SESSION_DAYS * 24 * 60 * 60;
let deadlineKey: CryptoKey | null = null;

function config() {
  const url = String(env.SUPABASE_URL || '').replace(/\/$/, '');
  const key = String(env.SUPABASE_PUBLISHABLE_KEY || '');
  if (!url || !key) throw new Error('Thiếu cấu hình Supabase.');
  return { url, key };
}

function b64url(bytes: Uint8Array) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function getDeadlineKey() {
  if (deadlineKey) return deadlineKey;
  let raw = await env.SESSION.get('security:auth-deadline-key-v1');
  if (!raw) {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    raw = b64url(bytes);
    await env.SESSION.put('security:auth-deadline-key-v1', raw);
  }
  deadlineKey = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(raw),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']
  );
  return deadlineKey;
}

async function signDeadline(deadline: number) {
  const sig = new Uint8Array(await crypto.subtle.sign(
    'HMAC', await getDeadlineKey(), new TextEncoder().encode(String(deadline))
  ));
  return `${deadline}.${b64url(sig)}`;
}

async function readDeadline(cookies: any) {
  const raw = cookies.get(DEADLINE_COOKIE)?.value || '';
  const [ts, sig] = raw.split('.');
  const deadline = Number(ts || '0');
  if (!Number.isFinite(deadline) || !sig || deadline <= Math.floor(Date.now()/1000)) return 0;
  const normalized = sig.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
  try {
    const bin = atob(padded);
    const bytes = Uint8Array.from(bin, ch => ch.charCodeAt(0));
    const ok = await crypto.subtle.verify(
      'HMAC', await getDeadlineKey(), bytes, new TextEncoder().encode(String(deadline))
    );
    return ok ? deadline : 0;
  } catch { return 0; }
}

function cookieOptions(maxAge: number) {
  return { httpOnly: true, secure: true, sameSite: 'lax' as const, path: '/', maxAge };
}

export function clearAuthCookies(cookies: any) {
  cookies.delete(ACCESS_COOKIE, { path: '/' });
  cookies.delete(REFRESH_COOKIE, { path: '/' });
  cookies.delete(DEADLINE_COOKIE, { path: '/' });
}

export async function setAuthCookies(cookies: any, session: any, deadline?: number) {
  const now = Math.floor(Date.now()/1000);
  const absolute = deadline || now + SESSION_SECONDS;
  const remaining = Math.max(1, absolute - now);
  cookies.set(ACCESS_COOKIE, String(session.access_token || ''), cookieOptions(remaining));
  if (session.refresh_token) cookies.set(REFRESH_COOKIE, String(session.refresh_token), cookieOptions(remaining));
  cookies.set(DEADLINE_COOKIE, await signDeadline(absolute), cookieOptions(remaining));
}

export type SessionUser = {
  id: string;
  email: string | null;
  role: 'admin' | 'member';
  username: string | null;
  display_name: string | null;
  avatar_key: string | null;
};

async function authRequest(path: string, init: RequestInit = {}) {
  const { url, key } = config();
  return fetch(`${url}${path}`, {
    ...init,
    headers: { apikey: key, 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
}

export async function signInWithPassword(email: string, password: string) {
  const res = await authRequest('/auth/v1/token?grant_type=password', {
    method: 'POST', body: JSON.stringify({ email, password }),
  });
  const data: any = await res.json();
  if (!res.ok || !data.access_token) throw new Error(data?.error_description || data?.msg || 'Email hoặc mật khẩu không đúng.');
  return data;
}

export async function signUpWithPassword(email: string, password: string) {
  const res = await authRequest('/auth/v1/signup', {
    method: 'POST', body: JSON.stringify({ email, password }),
  });
  const data: any = await res.json();
  if (!res.ok) throw new Error(data?.error_description || data?.msg || data?.message || 'Không thể đăng ký tài khoản.');
  return data;
}

export async function refreshSession(refreshToken: string) {
  const res = await authRequest('/auth/v1/token?grant_type=refresh_token', {
    method: 'POST', body: JSON.stringify({ refresh_token: refreshToken }),
  });
  const data: any = await res.json();
  if (!res.ok || !data.access_token) throw new Error('Phiên đăng nhập đã hết hạn.');
  return data;
}

async function readUser(accessToken: string): Promise<SessionUser | null> {
  if (!accessToken) return null;
  const { url, key } = config();
  const userRes = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: key, Authorization: `Bearer ${accessToken}` },
  });
  if (!userRes.ok) return null;
  const user: any = await userRes.json();

  const profileRes = await fetch(
    `${url}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=username,display_name,role,avatar_key,is_active,can_comment&limit=1`,
    { headers: { apikey: key, Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } }
  );
  let profile: any = null;
  if (profileRes.ok) {
    const rows: any[] = await profileRes.json();
    profile = rows[0] || null;
  }
  if (!profile) {
    try {
      await fetch(`${url}/rest/v1/rpc/ensure_my_profile`, { method:'POST', headers:{ apikey:key, Authorization:`Bearer ${accessToken}`, 'Content-Type':'application/json' }, body:'{}' });
      const retry = await fetch(`${url}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=username,display_name,role,avatar_key,is_active,can_comment&limit=1`, { headers:{ apikey:key, Authorization:`Bearer ${accessToken}`, Accept:'application/json' } });
      if (retry.ok) { const rows:any[] = await retry.json(); profile = rows[0] || null; }
    } catch {}
  }
  if (profile?.is_active === false) return null;

  return {
    id: user.id,
    email: user.email ?? null,
    role: profile?.role === 'admin' ? 'admin' : 'member',
    username: profile?.username ?? null,
    display_name: profile?.display_name ?? null,
    avatar_key: profile?.avatar_key ?? null,
  };
}

export async function getSession(cookies: any): Promise<{ token: string; user: SessionUser } | null> {
  const deadline = await readDeadline(cookies);
  if (!deadline) {
    clearAuthCookies(cookies);
    return null;
  }

  let token = cookies.get(ACCESS_COOKIE)?.value || '';
  let user = await readUser(token);
  if (user) return { token, user };

  const refresh = cookies.get(REFRESH_COOKIE)?.value || '';
  if (!refresh) {
    clearAuthCookies(cookies);
    return null;
  }

  try {
    const session = await refreshSession(refresh);
    await setAuthCookies(cookies, session, deadline);
    token = session.access_token;
    user = await readUser(token);
    if (!user) throw new Error('Không đọc được tài khoản.');
    return { token, user };
  } catch {
    clearAuthCookies(cookies);
    return null;
  }
}

export async function getSessionUser(cookies: any) {
  return (await getSession(cookies))?.user || null;
}

export async function requireAdminSession(cookies: any) {
  const session = await getSession(cookies);
  return session?.user.role === 'admin' ? session : null;
}

export async function getAdminFromToken(token: string) {
  const user = await readUser(token);
  return user?.role === 'admin' ? user : null;
}

export async function updateAuthPassword(accessToken: string, password: string) {
  const res = await authRequest('/auth/v1/user', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ password }),
  });
  const data: any = await res.json();
  if (!res.ok) throw new Error(data?.msg || data?.message || 'Không thể đổi mật khẩu.');
  return data;
}

export async function revokeSession(accessToken: string) {
  if (!accessToken) return;
  try {
    await authRequest('/auth/v1/logout', {
      method: 'POST', headers: { Authorization: `Bearer ${accessToken}` }, body: '{}',
    });
  } catch {}
}
