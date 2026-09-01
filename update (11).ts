import type { APIRoute } from 'astro';
import { requireAdminSession } from '../../../../lib/auth';
import { supabaseRpc } from '../../../../lib/supabase';

export const prerender=false;
const clean=(v:any)=>String(v||'').trim();

export const POST:APIRoute=async({request,cookies,redirect})=>{
  const session=await requireAdminSession(cookies);
  if(!session)return redirect('/login?next=/admin');
  const form=await request.formData();
  const userId=clean(form.get('user_id'));
  const role=clean(form.get('role'))==='admin'?'admin':'member';
  const isActive=form.get('is_active')==='true';
  const canComment=form.get('can_comment')==='true';
  try{
    if(!userId)throw new Error('Thiếu tài khoản.');
    await supabaseRpc('admin_update_member',{
      p_user_id:userId,
      p_role:role,
      p_is_active:isActive,
      p_can_comment:canComment
    },session.token);
    return redirect('/admin?success='+encodeURIComponent('Đã cập nhật thành viên.')+'#admin-members');
  }catch(e:any){
    return redirect('/admin?error='+encodeURIComponent(e?.message||'Không thể cập nhật thành viên.')+'#admin-members');
  }
};
