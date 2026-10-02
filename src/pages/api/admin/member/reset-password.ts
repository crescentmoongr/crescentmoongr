import type { APIRoute } from 'astro';
import { requireAdminSession } from '../../../../lib/auth';
import { adminResetUserPassword } from '../../../../lib/supabase';
export const prerender=false;
export const POST:APIRoute=async({request,cookies,redirect})=>{const s=await requireAdminSession(cookies);if(!s)return redirect('/login?next=/admin/members');const f=await request.formData();const id=String(f.get('user_id')||'').trim(),pw=String(f.get('password')||'');try{if(!id)throw new Error('Thiếu tài khoản.');if(pw.length<8)throw new Error('Mật khẩu mới cần ít nhất 8 ký tự.');await adminResetUserPassword(id,pw);return redirect('/admin/members?success='+encodeURIComponent('Đã cấp lại mật khẩu.'));}catch(e:any){return redirect('/admin/members?error='+encodeURIComponent(e?.message||'Không thể cấp lại mật khẩu.'));}};
