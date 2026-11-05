import type { APIRoute } from 'astro';
import { requireAdminSession } from '../../../../lib/auth';
import { getAdminSeriesById, supabasePatch } from '../../../../lib/supabase';
export const prerender=false;
export const POST:APIRoute=async({request,cookies,redirect})=>{
  const admin=await requireAdminSession(cookies);
  if(!admin) return redirect('/login?next=/admin/series');
  const origin=request.headers.get('origin');
  if(origin && origin!==new URL(request.url).origin) return new Response('Forbidden',{status:403});
  const form=await request.formData();
  const id=String(form.get('id')||'');
  const published=String(form.get('published')||'');
  if(!/^[0-9a-f-]{36}$/i.test(id)||!['true','false'].includes(published)) return redirect('/admin/series?error='+encodeURIComponent('Yêu cầu không hợp lệ.'));
  try{
    const series=await getAdminSeriesById(id,admin.token);
    if(!series) throw new Error('Không tìm thấy truyện.');
    await supabasePatch(`series?id=eq.${encodeURIComponent(id)}`,admin.token,{is_published:published==='true'});
    return redirect('/admin/series?success='+encodeURIComponent(published==='true'?'Đã hiện truyện trên website.':'Đã ẩn truyện hoàn toàn khỏi website.'));
  }catch(e){return redirect('/admin/series?error='+encodeURIComponent(e instanceof Error?e.message:'Không thể đổi trạng thái.'));}
};
