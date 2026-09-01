import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getSession } from '../../../lib/auth';
import { supabaseGet } from '../../../lib/supabase';
export const prerender = false;
export const GET: APIRoute = async ({ params, cookies }) => {
  const session = await getSession(cookies);
  const id = params.id || '';
  if (!session || session.user.id !== id) return new Response('Forbidden', { status: 403 });
  const rows = await supabaseGet<any[]>(`profiles?id=eq.${encodeURIComponent(id)}&select=avatar_key&limit=1`, session.token);
  const key = rows[0]?.avatar_key || '';
  if (!key) return new Response('Not found', { status: 404 });
  const object = await env.MANGA_STORAGE.get(key);
  if (!object) return new Response('Not found', { status: 404 });
  const headers = new Headers(); object.writeHttpMetadata(headers);
  headers.set('cache-control','private, max-age=300'); headers.set('x-content-type-options','nosniff');
  return new Response(object.body,{headers});
};
