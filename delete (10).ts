import type { APIRoute } from 'astro';
import { requireAdminSession } from '../../../../lib/auth';
import { supabaseRpc } from '../../../../lib/supabase';
export const prerender=false;
export const POST:APIRoute=async({request,cookies,redirect})=>{
 const session=await requireAdminSession(cookies);if(!session)return redirect('/login?next=/admin');
 const f=await request.formData();try{await supabaseRpc('admin_delete_genre',{p_id:String(f.get('id')||'')},session.token);return redirect('/admin?success='+encodeURIComponent('Đã xóa thể loại khỏi danh mục.')+'#admin-genres')}catch(e:any){return redirect('/admin?error='+encodeURIComponent(e?.message||'Không thể xóa thể loại.')+'#admin-genres')}
};
