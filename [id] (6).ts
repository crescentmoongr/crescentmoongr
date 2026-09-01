import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getSeriesById } from '../../../lib/supabase';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const id = params.id;
  if (!id) return new Response('Not found', { status: 404 });

  const series = await getSeriesById(id);
  if (!series?.cover_key) return new Response('Not found', { status: 404 });

  const object = await env.MANGA_STORAGE.get(series.cover_key);
  if (!object) return new Response('Not found', { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('cache-control', 'public, max-age=86400');

  return new Response(object.body, { headers });
};
