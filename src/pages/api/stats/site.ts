import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender=false;

async function supabaseRpc(name:string){
  const url=String(env.SUPABASE_URL||'').replace(/\/$/,'');
  const key=String(env.SUPABASE_SERVICE_ROLE_KEY||'').trim();
  if(!url||!key) throw new Error('Server config error');
  const r=await fetch(`${url}/rest/v1/rpc/${name}`,{
    method:'POST',
    headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',Accept:'application/json'},
    body:'{}'
  });
  if(!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`);
  return await r.json();
}

const response=(data:any)=>new Response(JSON.stringify(data||{today:0,month:0,total:0}),{
  headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}
});

export const POST:APIRoute=async()=>{
  try{return response(await supabaseRpc('track_site_view'))}
  catch(err){console.error('[SiteStats] track failed',err);return new Response('Stats unavailable',{status:503})}
};

export const GET:APIRoute=async()=>{
  try{return response(await supabaseRpc('get_site_view_stats'))}
  catch(err){console.error('[SiteStats] read failed',err);return new Response('Stats unavailable',{status:503})}
};
