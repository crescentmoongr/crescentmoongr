import type { APIRoute } from 'astro';
import { requireAdminSession } from '../../../../lib/auth';
import { supabaseRpc } from '../../../../lib/supabase';
export const prerender=false;
const clean=(v:any)=>String(v||'').trim();
export const POST:APIRoute=async({request,cookies,redirect})=>{
 const session=await requireAdminSession(cookies);if(!session)return redirect('/login?next=/admin');
 const f=await request.formData();try{const name=clean(f.get('name'));if(!name)throw new Error('Tên thể loại là bắt buộc.');await supabaseRpc('admin_save_genre',{p_id:clean(f.get('id'))||null,p_name:name},session.token);return redirect('/admin?success='+encodeURIComponent('Đã lưu thể loại.')+'#admin-genres')}catch(e:any){return redirect('/admin?error='+encodeURIComponent(e?.message||'Không thể lưu thể loại.')+'#admin-genres')}
};
