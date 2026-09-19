import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender=false;

export const POST:APIRoute=async({request})=>{
  let chapterId='';
  try{const body=await request.json() as any;chapterId=String(body?.chapter_id||'').trim()}catch{}
  if(!/^[0-9a-f-]{36}$/i.test(chapterId)) return new Response('Bad request',{status:400});

  const url=String(env.SUPABASE_URL||'').replace(/\/$/,'');
  const key=String(env.SUPABASE_SERVICE_ROLE_KEY||'').trim();
  if(!url||!key) return new Response('Server config error',{status:500});

  try{
    const r=await fetch(`${url}/rest/v1/rpc/increment_chapter_view`,{
      method:'POST',
      headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',Accept:'application/json'},
      body:JSON.stringify({p_chapter_id:chapterId})
    });
    if(!r.ok){console.error('[Views] Supabase',r.status,await r.text());return new Response('View not counted',{status:503})}
    return new Response(null,{status:204,headers:{'Cache-Control':'no-store'}});
  }catch(err){console.error('[Views] failed',err);return new Response('View not counted',{status:503})}
};
