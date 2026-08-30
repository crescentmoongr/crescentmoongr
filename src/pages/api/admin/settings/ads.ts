import type { APIRoute } from 'astro';
import { requireAdminSession } from '../../../../lib/auth';
import { supabaseGet, supabasePatch, supabasePost } from '../../../../lib/supabase';

export const prerender=false;

export const POST:APIRoute=async({request,cookies})=>{
  const admin=await requireAdminSession(cookies);
  if(!admin) return new Response('Unauthorized',{status:401});

  const form=await request.formData();
  const html=String(form.get('ad_html')||'').trim().slice(0,100000);

  const existing=await supabaseGet<any[]>(
    `site_settings?select=key&key=eq.reader_ad_html&limit=1`,
    admin.token
  );

  if(existing[0]){
    await supabasePatch(
      'site_settings?key=eq.reader_ad_html',
      admin.token,
      {value:html,updated_at:new Date().toISOString()}
    );
  }else{
    await supabasePost(
      'site_settings',
      admin.token,
      {key:'reader_ad_html',value:html,updated_at:new Date().toISOString()}
    );
  }

  return Response.redirect(new URL('/admin?success='+encodeURIComponent('Đã lưu mã quảng cáo.'),request.url),303);
};
