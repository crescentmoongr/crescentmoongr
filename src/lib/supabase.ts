import { env } from 'cloudflare:workers';

export type Series = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  author: string | null;
  artist: string | null;
  cover_key: string | null;
  type: string | null;
  status: 'ongoing' | 'completed' | 'hiatus' | 'dropped';
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type Chapter = {
  id: string;
  series_id: string;
  chapter_number: number;
  title: string | null;
  access_type: 'public' | 'password' | 'member';
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

function config() {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('Thiếu SUPABASE_URL hoặc SUPABASE_PUBLISHABLE_KEY trên Cloudflare.');
  return { url: String(url).replace(/\/$/, ''), key: String(key) };
}

async function supabaseGet<T>(path: string, token?: string): Promise<T> {
  const { url, key } = config();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${token || key}`,
      Accept: 'application/json',
    },
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase ${response.status}: ${detail}`);
  }
  return response.json() as Promise<T>;
}

export async function supabasePost<T>(path: string, token: string, body: unknown): Promise<T> {
  const { url, key } = config();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase ${response.status}: ${detail}`);
  }
  return response.json() as Promise<T>;
}

export async function getSeriesList(): Promise<Series[]> {
  return supabaseGet<Series[]>('series?select=*&is_published=eq.true&order=updated_at.desc');
}

export async function getAdminSeriesList(token: string): Promise<Series[]> {
  return supabaseGet<Series[]>('series?select=*&order=updated_at.desc', token);
}

export async function getSeriesBySlug(slug: string): Promise<Series | null> {
  const rows = await supabaseGet<Series[]>(`series?select=*&slug=eq.${encodeURIComponent(slug)}&is_published=eq.true&limit=1`);
  return rows[0] ?? null;
}

export async function getSeriesById(id: string): Promise<Series | null> {
  const rows = await supabaseGet<Series[]>(`series?select=*&id=eq.${encodeURIComponent(id)}&is_published=eq.true&limit=1`);
  return rows[0] ?? null;
}

export async function getChapters(seriesId: string): Promise<Chapter[]> {
  return supabaseGet<Chapter[]>(`chapters?select=*&series_id=eq.${encodeURIComponent(seriesId)}&is_published=eq.true&order=chapter_number.desc`);
}

export async function getChapter(seriesId: string, chapterNumber: string): Promise<Chapter | null> {
  const rows = await supabaseGet<Chapter[]>(`chapters?select=*&series_id=eq.${encodeURIComponent(seriesId)}&chapter_number=eq.${encodeURIComponent(chapterNumber)}&is_published=eq.true&limit=1`);
  return rows[0] ?? null;
}

export function statusLabel(status: Series['status']) {
  return ({ ongoing: 'Đang tiến hành', completed: 'Hoàn thành', hiatus: 'Tạm ngưng', dropped: 'Drop' } as const)[status] ?? status;
}

export function accessLabel(access: Chapter['access_type']) {
  return ({ public: 'Đọc →', password: '🔒 Mật khẩu', member: '🔒 Thành viên' } as const)[access] ?? access;
}
