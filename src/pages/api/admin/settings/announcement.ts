import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { requireAdminSession } from '../../../../lib/auth';
import { sanitizeRichText } from '../../../../lib/richText';

export const prerender=false;

async function saveAnnouncement(html:string){
  const url=String(env.SUPABASE_URL||'').replace(/\/$/,'');
  const key=String(env.SUPABASE_SERVICE_ROLE_KEY||'').trim();
  if(!url||!key) throw new Error('Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trên Cloudflare.');

  const r=await fetch(`${url}/rest/v1/site_settings?on_conflict=key`,{
    method:'POST',
    headers:{
      apikey:key,
      Authorization:`Bearer ${key}`,
      Accept:'application/json',
      'Content-Type':'application/json',
      Prefer:'resolution=merge-duplicates,return=minimal'
    },
    body:JSON.stringify({
      key:'site_announcement_html',
      value:html,
      updated_at:new Date().toISOString()
    })
  });
  if(!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`);
}

export const POST:APIRoute=async({request,cookies})=>{
  const admin=await requireAdminSession(cookies);
  if(!admin) return new Response('Unauthorized',{status:401});

  try{
    const form=await request.formData();
    const html=sanitizeRichText(String(form.get('announcement_html')||''));
    await saveAnnouncement(html);
    return Response.redirect(new URL('/admin?success='+encodeURIComponent('Đã lưu thông báo chung.')+'#admin-announcement',request.url),303);
  }catch(e:any){
    return Response.redirect(new URL('/admin?error='+encodeURIComponent(e?.message||'Không thể lưu thông báo chung.')+'#admin-announcement',request.url),303);
  }
};
