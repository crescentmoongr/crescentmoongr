import type { APIRoute } from 'astro';
import { requireAdminSession } from '../../../../lib/auth';
import { sanitizeRichText } from '../../../../lib/richText';
import { supabaseGet, supabasePatch, supabasePost } from '../../../../lib/supabase';

export const prerender=false;

export const POST:APIRoute=async({request,cookies})=>{
  const admin=await requireAdminSession(cookies);
  if(!admin) return new Response('Unauthorized',{status:401});

  try{
    const form=await request.formData();
    const html=sanitizeRichText(String(form.get('announcement_html')||''));
    const existing=await supabaseGet<any[]>(
      'site_settings?select=key&key=eq.site_announcement_html&limit=1',
      admin.token
    );

    if(existing[0]){
      await supabasePatch(
        'site_settings?key=eq.site_announcement_html',
        admin.token,
        {value:html,updated_at:new Date().toISOString()}
      );
    }else{
      await supabasePost(
        'site_settings',
        admin.token,
        {key:'site_announcement_html',value:html,updated_at:new Date().toISOString()}
      );
    }

    return Response.redirect(new URL('/admin?success='+encodeURIComponent('Đã lưu thông báo chung.')+'#admin-announcement',request.url),303);
  }catch(e:any){
    return Response.redirect(new URL('/admin?error='+encodeURIComponent(e?.message||'Không thể lưu thông báo chung.')+'#admin-announcement',request.url),303);
  }
};
