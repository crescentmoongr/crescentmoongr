import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getSeriesById, getAdminSeriesById } from '../../../lib/supabase';
import { requireAdminSession } from '../../../lib/auth';

export const prerender = false;

export const GET: APIRoute = async ({ params, url, cookies }) => {
  const id = params.id;
  if (!id) return new Response('Not found', { status: 404 });

  let series = await getSeriesById(id);
  let isAdminPreview = false;
  if(!series && url.searchParams.get('admin')==='1'){
    const admin=await requireAdminSession(cookies);
    if(admin){series=await getAdminSeriesById(id,admin.token);isAdminPreview=true;}
  }
  if (!series?.cover_key) return new Response('Not found', { status: 404 });

  const object = await env.MANGA_STORAGE.get(series.cover_key);
  if (!object) return new Response('Not found', { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('cache-control', isAdminPreview ? 'private, no-store' : 'public, max-age=86400');

  return new Response(object.body, { headers });
};
