import type { APIRoute } from 'astro';
import { requireAdminSession } from '../../../../lib/auth';
import { supabaseGet,supabasePatch,supabasePost } from '../../../../lib/supabase';

export const prerender=false;

const safeUrl=(value:FormDataEntryValue|null)=>{
  const text=String(value||'').trim();
  if(!text)return '';
  try{
    const url=new URL(text);
    if(!['http:','https:'].includes(url.protocol))throw new Error();
    return url.href.slice(0,1000);
  }catch{
    throw new Error(`Link không hợp lệ: ${text}`);
  }
};

export const POST:APIRoute=async({request,cookies})=>{
  const admin=await requireAdminSession(cookies);
  if(!admin)return new Response('Unauthorized',{status:401});

  try{
    const form=await request.formData();
    const value=JSON.stringify({
      facebook:safeUrl(form.get('facebook')),
      telegram:safeUrl(form.get('telegram')),
      discord:safeUrl(form.get('discord'))
    });

    const existing=await supabaseGet<any[]>(
      'site_settings?select=key&key=eq.social_links&limit=1',
      admin.token
    );

    if(existing[0]){
      await supabasePatch(
        'site_settings?key=eq.social_links',
        admin.token,
        {value,updated_at:new Date().toISOString()}
      );
    }else{
      await supabasePost(
        'site_settings',
        admin.token,
        {key:'social_links',value,updated_at:new Date().toISOString()}
      );
    }

    return Response.redirect(new URL('/admin?success='+encodeURIComponent('Đã lưu link mạng xã hội.')+'#admin-social',request.url),303);
  }catch(e:any){
    return Response.redirect(new URL('/admin?error='+encodeURIComponent(e?.message||'Không thể lưu link mạng xã hội.')+'#admin-social',request.url),303);
  }
};
