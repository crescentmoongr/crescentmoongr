import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { checkinVn } from '../../../lib/supabase';
export const POST:APIRoute=async({cookies,redirect})=>{const s=await getSession(cookies);if(!s)return redirect('/login?next=/account',303);if(s.user.role!=='admin')return redirect('/account?error='+encodeURIComponent('Điểm danh đang ở chế độ thử nghiệm.'),303);try{await checkinVn(s.token);return redirect('/account?success='+encodeURIComponent('Đã điểm danh theo ngày Việt Nam.'),303)}catch(e){return redirect('/account?error='+encodeURIComponent(e instanceof Error?e.message:'Không thể điểm danh.'),303)}};
