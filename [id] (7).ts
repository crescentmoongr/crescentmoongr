import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { supabaseGet, type ChapterPage } from '../../../lib/supabase';
import { getReaderSession, verifyPageSignature } from '../../../lib/readerSecurity';
export const prerender=false;

const buckets=new Map<string,{n:number,t:number}>();
function allowed(session:string){
  const now=Date.now(); let x=buckets.get(session);
  if(!x||now-x.t>60000){x={n:0,t:now};buckets.set(session,x)}
  x.n++; return x.n<=180;
}

export const GET:APIRoute=async({params,url,cookies,request})=>{
  const id=params.id||''; const chapterId=url.searchParams.get('c')||''; const seriesId=url.searchParams.get('m')||'';
  const exp=Number(url.searchParams.get('e')||'0'); const sig=url.searchParams.get('s')||''; const session=getReaderSession(cookies);
  const site=request.headers.get('Sec-Fetch-Site'); if(site && !['same-origin','same-site','none'].includes(site)) return new Response('Forbidden',{status:403});
  const ref=request.headers.get('referer'); if(ref){try{if(new URL(ref).host!==url.host) return new Response('Forbidden',{status:403})}catch{return new Response('Forbidden',{status:403})}}
  if(!allowed(session||'none')) return new Response('Too many requests',{status:429,headers:{'Retry-After':'60'}});
  if(!await verifyPageSignature(id,seriesId,chapterId,session,exp,sig)) return new Response('Expired or invalid image token',{status:403});
  const rows=await supabaseGet<ChapterPage[]>(`chapter_pages?select=id,chapter_id,page_number,object_key,created_at&id=eq.${encodeURIComponent(id)}&chapter_id=eq.${encodeURIComponent(chapterId)}&limit=1`);
  const pg=rows[0]; if(!pg) return new Response('Not found',{status:404});
  const o=await env.MANGA_STORAGE.get(pg.object_key); if(!o) return new Response('Not found',{status:404});
  const h=new Headers(); o.writeHttpMetadata(h); h.set('etag',o.httpEtag); h.set('cache-control','private, no-store'); h.set('x-content-type-options','nosniff'); h.set('content-disposition','inline');
  return new Response(o.body,{headers:h});
};
