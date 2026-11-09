import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { supabaseGet, getSeriesById, type ChapterPage } from '../../../lib/supabase';
import { getReaderSession, verifyPageSignature } from '../../../lib/readerSecurity';
export const prerender=false;

const diagnosticHeaders=(code:string)=>({
  'Cache-Control':'private, no-store',
  'X-CM-Image-Error':code,
  'X-Content-Type-Options':'nosniff'
});
const denied=(status:number,code:string)=>new Response(status===403?'Forbidden':'Not found',{
  status,headers:diagnosticHeaders(code)
});
export const GET:APIRoute=async({params,url,cookies,request})=>{
  const id=params.id||'';
  const chapterId=url.searchParams.get('c')||'';
  const seriesId=url.searchParams.get('m')||'';
  const exp=Number(url.searchParams.get('e')||'0');
  const sig=url.searchParams.get('s')||'';
  const session=getReaderSession(cookies);
  const site=request.headers.get('Sec-Fetch-Site');
  if(site&&!['same-origin','same-site','none'].includes(site))return denied(403,'FETCH_SITE');
  const ref=request.headers.get('referer');
  if(ref){
    try{if(new URL(ref).host!==url.host)return denied(403,'REFERER')}
    catch{return denied(403,'REFERER')}
  }
  if(!session)return denied(403,'SESSION');
  if(!await verifyPageSignature(id,seriesId,chapterId,session,exp,sig))return denied(403,'SIGNATURE');
  try{
    // Preserve published-series and page ownership checks from v13.12.
    if(!await getSeriesById(seriesId))return denied(404,'SERIES');
    const rows=await supabaseGet<ChapterPage[]>(`chapter_pages?select=id,chapter_id,page_number,object_key,created_at&id=eq.${encodeURIComponent(id)}&chapter_id=eq.${encodeURIComponent(chapterId)}&limit=1`);
    const pg=rows[0];if(!pg)return denied(404,'PAGE');
    const o=await env.MANGA_STORAGE.get(pg.object_key);
    if(!o)return denied(404,'R2_OBJECT');
    const h=new Headers();o.writeHttpMetadata(h);
    h.set('etag',o.httpEtag);h.set('cache-control','private, no-store');
    h.set('x-content-type-options','nosniff');h.set('content-disposition','inline');
    h.set('x-cm-image-result','OK');
    return new Response(o.body,{headers:h});
  }catch(error){
    console.error('[CM image worker] INTERNAL',error instanceof Error?error.name:'unknown');
    return new Response('Image service unavailable',{status:500,headers:diagnosticHeaders('INTERNAL')});
  }
};
