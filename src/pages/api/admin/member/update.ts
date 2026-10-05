import type { APIRoute } from 'astro';
import { requireAdminSession } from '../../../../lib/auth';
import { supabaseRpc, findServiceProfileByUsername, setServiceProfileUsername } from '../../../../lib/supabase';
export const prerender=false;
const clean=(v:any)=>String(v||'').trim();
export const POST:APIRoute=async({request,cookies,redirect})=>{
  const session=await requireAdminSession(cookies); if(!session)return redirect('/login?next=/admin');
  const form=await request.formData(); const userId=clean(form.get('user_id')); const role=clean(form.get('role'))==='admin'?'admin':'member';
  const isActive=form.get('is_active')==='true'; const canComment=form.get('can_comment')==='true';
  const usernameRaw=clean(form.get('username')).toLowerCase(); const username=usernameRaw.replace(/[^a-z0-9_.-]/g,'').slice(0,40);
  try{
    if(!userId)throw new Error('Thiếu tài khoản.');
    if(usernameRaw){
      if(username.length<3||username!==usernameRaw)throw new Error('Username cần 3–40 ký tự và chỉ dùng chữ cái, số, dấu chấm, gạch dưới hoặc gạch ngang.');
      const existing=await findServiceProfileByUsername(username); if(existing&&existing.id!==userId)throw new Error('Username này đã có người sử dụng rồi.');
      await setServiceProfileUsername(userId,username);
    }
    await supabaseRpc('admin_update_member',{p_user_id:userId,p_role:role,p_is_active:isActive,p_can_comment:canComment},session.token);
    const currentStreak=Math.max(0,Number(form.get('current_streak')||0)||0); const highestStreak=Math.max(currentStreak,Number(form.get('highest_streak')||0)||0);
    const rankKey=clean(form.get('rank_key'))||'none'; const achievements=form.getAll('achievements').map(clean).filter(Boolean); const activeAchievement=clean(form.get('active_achievement'))||null;
    await supabaseRpc('admin_update_member_rewards',{p_user_id:userId,p_current_streak:currentStreak,p_highest_streak:highestStreak,p_rank_key:rankKey,p_achievements:achievements,p_active_achievement:activeAchievement},session.token);
    return redirect('/admin/members?success='+encodeURIComponent('Đã cập nhật thành viên.'));
  }catch(e:any){const msg=String(e?.message||'');return redirect('/admin/members?error='+encodeURIComponent(/duplicate|unique|23505/i.test(msg)?'Username này đã có người sử dụng rồi.':(msg||'Không thể cập nhật thành viên.')));}
};
