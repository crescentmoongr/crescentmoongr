import type { APIRoute } from 'astro';
import { requireAdminSession } from '../../../../lib/auth';
import { supabaseRpc } from '../../../../lib/supabase';
export const prerender=false;
const clean=(v:any)=>String(v||'').trim();
const safeUrl=(v:string)=>{if(!v)return null;try{const u=new URL(v);if(!['http:','https:'].includes(u.protocol))throw 0;return u.href.slice(0,1000)}catch{throw new Error('Link X không hợp lệ.')}};
export const POST:APIRoute=async({request,cookies,redirect})=>{
  const session=await requireAdminSession(cookies);if(!session)return redirect('/login?next=/admin');
  const f=await request.formData();
  try{
    const name=clean(f.get('name'));if(!name)throw new Error('Tên tác giả là bắt buộc.');
    await supabaseRpc('admin_save_author',{p_id:clean(f.get('id'))||null,p_name:name,p_x_url:safeUrl(clean(f.get('x_url')))},session.token);
    return redirect('/admin?success='+encodeURIComponent('Đã lưu tác giả.')+'#admin-authors');
  }catch(e:any){return redirect('/admin?error='+encodeURIComponent(e?.message||'Không thể lưu tác giả.')+'#admin-authors')}
};
