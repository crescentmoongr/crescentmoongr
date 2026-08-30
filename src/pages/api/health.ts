import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getSeriesList } from '../../lib/supabase';

export const prerender = false;
export const GET: APIRoute = async () => {
  try {
    const series = await getSeriesList();
    return new Response(JSON.stringify({ ok: true, supabase: true, r2_binding: Boolean(env.MANGA_STORAGE), series_count: series.length }), {
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }
};
