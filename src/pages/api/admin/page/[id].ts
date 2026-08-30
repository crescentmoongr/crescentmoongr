import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { requireAdminSession } from '../../../../lib/auth';
import { supabaseGet, type ChapterPage } from '../../../../lib/supabase';
export const prerender=false;
export const GET:APIRoute=async({params,cookies,url,request})=>{
  const session=await requireAdminSession(cookies); if(!session) return new Response('Unauthorized',{status:401});
  const ref=request.headers.get('referer'); if(ref){try{if(new URL(ref).host!==url.host)return new Response('Forbidden',{status:403})}catch{return new Response('Forbidden',{status:403})}}
  const rows=await supabaseGet<ChapterPage[]>(`chapter_pages?select=*&id=eq.${encodeURIComponent(params.id||'')}&limit=1`,session.token); const pg=rows[0]; if(!pg)return new Response('Not found',{status:404});
  const o=await env.MANGA_STORAGE.get(pg.object_key); if(!o)return new Response('Not found',{status:404}); const h=new Headers();o.writeHttpMetadata(h);h.set('cache-control','private, no-store');h.set('x-content-type-options','nosniff');return new Response(o.body,{headers:h});
};