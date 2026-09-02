import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { supabaseRpc } from '../../../lib/supabase';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const id = params.id || '';
  if (!id) return new Response('Not found', { status: 404 });

  let key = '';
  try {
    key = await supabaseRpc<string | null>('get_public_avatar_key', { p_user_id:id }) || '';
  } catch {
    return new Response('Not found', { status: 404 });
  }

  if (!key) return new Response('Not found', { status: 404 });

  const object = await env.MANGA_STORAGE.get(key);
  if (!object) return new Response('Not found', { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('cache-control','public, max-age=300');
  headers.set('x-content-type-options','nosniff');

  return new Response(object.body,{headers});
};
