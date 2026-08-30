import { env } from 'cloudflare:workers';

function config() {
  const url = String(env.SUPABASE_URL || '').replace(/\/$/, '');
  const key = String(env.SUPABASE_PUBLISHABLE_KEY || '');
  if (!url || !key) throw new Error('Thiếu cấu hình Supabase.');
  return { url, key };
}

export type AdminUser = {
  id: string;
  email: string | null;
  role: string;
};

export async function signInWithPassword(email: string, password: string) {
  const { url, key } = config();
  const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: key,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const data: any = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(data?.error_description || data?.msg || 'Email hoặc mật khẩu không đúng.');
  }
  return data;
}

export async function getAdminFromToken(token: string): Promise<AdminUser | null> {
  if (!token) return null;
  const { url, key } = config();

  const userRes = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: key, Authorization: `Bearer ${token}` },
  });
  if (!userRes.ok) return null;
  const user: any = await userRes.json();

  const profileRes = await fetch(
    `${url}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role&limit=1`,
    { headers: { apikey: key, Authorization: `Bearer ${token}`, Accept: 'application/json' } }
  );
  if (!profileRes.ok) return null;
  const profiles: any[] = await profileRes.json();
  if (profiles[0]?.role !== 'admin') return null;

  return { id: user.id, email: user.email ?? null, role: 'admin' };
}
