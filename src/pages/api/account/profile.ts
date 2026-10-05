import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { supabasePatch, findServiceProfileByUsername } from '../../../lib/supabase';
export const prerender = false;
export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const session = await getSession(cookies);
  if (!session) return redirect('/login?next=/account');
  const form = await request.formData();
  const displayName = String(form.get('display_name') || '').trim().slice(0,80);
  const currentUsername=String(session.user.username||'').trim().toLowerCase();
  const usernameRaw = String(form.get('username') || '').trim().toLowerCase();
  const username = usernameRaw.replace(/[^a-z0-9_.-]/g,'').slice(0,40);
  try {
    const patch:any={display_name:displayName||null,updated_at:new Date().toISOString()};
    if(!currentUsername){
      if(!username || username.length<3 || username!==usernameRaw) return redirect('/account?error='+encodeURIComponent('Username cần 3–40 ký tự và chỉ dùng chữ cái, số, dấu chấm, gạch dưới hoặc gạch ngang.'));
      const existing=await findServiceProfileByUsername(username);
      if(existing && existing.id!==session.user.id)return redirect('/account?error='+encodeURIComponent('Username này đã có người sử dụng rồi, chọn tên khác nha ♡'));
      patch.username=username;
    }
    await supabasePatch(`profiles?id=eq.${encodeURIComponent(session.user.id)}`,session.token,patch);
    return redirect('/account?success='+encodeURIComponent(!currentUsername?'Đã đặt Username. Username của cậu đã được khóa ♡':'Đã lưu hồ sơ.'));
  } catch(e:any){
    const msg=String(e?.message||'');
    const friendly=/duplicate|unique|23505/i.test(msg)?'Username này đã có người sử dụng rồi, chọn tên khác nha ♡':(msg||'Không thể lưu hồ sơ.');
    return redirect('/account?error='+encodeURIComponent(friendly));
  }
};
