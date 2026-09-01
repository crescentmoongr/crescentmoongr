import type { APIRoute } from 'astro';
import { requireAdminSession } from '../../../../lib/auth';
import { supabaseRpc } from '../../../../lib/supabase';

export const prerender=false;
const clean=(v:any)=>String(v||'').trim();

export const POST:APIRoute=async({request,cookies,redirect})=>{
  const session=await requireAdminSession(cookies);
  if(!session)return redirect('/login?next=/admin');

  const form=await request.formData();
  const id=Number(clean(form.get('id')));
  const action=clean(form.get('action'));

  try{
    if(!Number.isFinite(id)||id<=0)throw new Error('Bình luận không hợp lệ.');
    if(!['approve','delete'].includes(action))throw new Error('Thao tác không hợp lệ.');

    await supabaseRpc('admin_moderate_comment',{
      p_id:id,
      p_action:action
    },session.token);

    const message=action==='approve'?'Đã duyệt bình luận.':'Đã xóa bình luận.';
    return redirect('/admin?success='+encodeURIComponent(message)+'#admin-comments');
  }catch(e:any){
    return redirect('/admin?error='+encodeURIComponent(e?.message||'Không thể xử lý bình luận.')+'#admin-comments');
  }
};
