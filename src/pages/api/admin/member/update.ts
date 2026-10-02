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
    const currentStreak=Math.max(0,Number(form.get('current_streak')||0)||0);
    const highestStreak=Math.max(currentStreak,Number(form.get('highest_streak')||0)||0);
    const rankKey=clean(form.get('rank_key'))||'none';
    const achievements=form.getAll('achievements').map(clean).filter(Boolean);
    const activeAchievement=clean(form.get('active_achievement'))||null;
    await supabaseRpc('admin_update_member_rewards',{p_user_id:userId,p_current_streak:currentStreak,p_highest_streak:highestStreak,p_rank_key:rankKey,p_achievements:achievements,p_active_achievement:activeAchievement},session.token);
    return redirect('/admin/members?success='+encodeURIComponent('Đã cập nhật thành viên.')+'');
  }catch(e:any){
    return redirect('/admin/members?error='+encodeURIComponent(e?.message||'Không thể cập nhật thành viên.')+'');
  }
};
