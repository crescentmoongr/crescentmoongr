import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { setMyMemberIdentity } from '../../../lib/supabase';
export const prerender=false;
export const POST:APIRoute=async({request,cookies,redirect})=>{const s=await getSession(cookies);if(!s)return redirect('/login?next=/account');const f=await request.formData();try{await setMyMemberIdentity(s.token,String(f.get('name_style')||'')||null,String(f.get('achievement')||'')||null);return redirect('/account?success='+encodeURIComponent('Đã cập nhật hiển thị thành viên.'));}catch(e:any){return redirect('/account?error='+encodeURIComponent(e?.message||'Không thể cập nhật.'));}};
