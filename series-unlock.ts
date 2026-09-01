import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getSeriesBySlug, supabaseRpc } from '../../lib/supabase';
import { ensureReaderSession, markSeriesUnlocked } from '../../lib/readerSecurity';
export const prerender=false;

async function fingerprint(request:Request){
  const raw=request.headers.get('CF-Connecting-IP')||'unknown';
  const d=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw)));
  return Array.from(d.slice(0,8)).map(x=>x.toString(16).padStart(2,'0')).join('');
}
function safeReturn(v:string, slug:string){return v.startsWith(`/read/${slug}/`) ? v : `/manga/${slug}`;}

export const POST:APIRoute=async({request,cookies,redirect})=>{
  const f=await request.formData();
  const slug=String(f.get('slug')||'').trim();
  const password=String(f.get('password')||'');
  const returnTo=safeReturn(String(f.get('return_to')||''),slug);
  if(!slug||!password) return redirect(`${returnTo}?unlock_error=${encodeURIComponent('Vui lòng nhập mật khẩu.')}`);
  const series=await getSeriesBySlug(slug);
  if(!series) return new Response('Không tìm thấy truyện.',{status:404});
  if(series.access_type!=='password') return redirect(returnTo);

  const fp=await fingerprint(request); const key=`unlock-attempt:${series.id}:${fp}`;
  let count=Number(await env.SESSION.get(key)||'0');
  if(count>=10) return redirect(`${returnTo}?unlock_error=${encodeURIComponent('Bạn đã thử quá nhiều lần. Vui lòng thử lại sau ít phút.')}`);
  const ok=await supabaseRpc<boolean>('verify_series_password',{p_series_id:series.id,p_password:password});
  if(!ok){await env.SESSION.put(key,String(count+1),{expirationTtl:600}); return redirect(`${returnTo}?unlock_error=${encodeURIComponent('Mật khẩu không đúng.')}`)}
  await env.SESSION.delete(key);
  const sid=ensureReaderSession(cookies); await markSeriesUnlocked(sid,series.id);
  return redirect(returnTo);
};
