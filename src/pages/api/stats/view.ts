import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { ensureReaderSession } from '../../../lib/readerSecurity';
import { supabaseRpc } from '../../../lib/supabase';
export const prerender=false;
export const POST:APIRoute=async({request,cookies})=>{
  let data:any={}; try{data=await request.json()}catch{return new Response(null,{status:400})}
  const chapterId=String(data.chapter_id||''); if(!chapterId) return new Response(null,{status:400});
  const session=ensureReaderSession(cookies); const key=`view:${session}:${chapterId}`;
  if(await env.SESSION.get(key)) return new Response(null,{status:204});
  await env.SESSION.put(key,'1',{expirationTtl:180});
  try{await supabaseRpc('increment_chapter_view',{p_chapter_id:chapterId})}catch{}
  return new Response(null,{status:204});
};