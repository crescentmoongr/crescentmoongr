import type { APIRoute } from 'astro';
import { requireAdminSession } from '../../../../lib/auth';
import { adminTestMemberRewards } from '../../../../lib/supabase';
export const POST:APIRoute=async({cookies,request,redirect})=>{const s=await requireAdminSession(cookies);if(!s)return redirect('/login',303);const f=await request.formData();try{await adminTestMemberRewards(s.token,Number(f.get('streak')||0),String(f.get('achievement')||'')||null,String(f.get('name_style')||'')||null);return redirect('/account?success='+encodeURIComponent('Đã áp dụng dữ liệu test Admin.'),303)}catch(e){return redirect('/account?error='+encodeURIComponent(e instanceof Error?e.message:'Test thất bại.'),303)}};
