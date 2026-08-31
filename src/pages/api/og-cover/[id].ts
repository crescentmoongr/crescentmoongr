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
  headers.set('cache-control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400');
  headers.set('access-control-allow-origin', '*');
  headers.set('x-content-type-options', 'nosniff');

  // Covers uploaded by the site are JPG/PNG/WebP. Preserve R2 metadata;
  // fall back to a crawler-friendly image type when metadata is absent.
  if (!headers.get('content-type')) headers.set('content-type', 'image/jpeg');

  return new Response(object.body, { headers });
};
