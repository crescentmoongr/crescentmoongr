import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { checkinVn } from '../../../lib/supabase';
export const prerender=false;
export const POST:APIRoute=async({request,cookies,redirect})=>{const s=await getSession(cookies);if(!s)return redirect('/login?next=/check-in',303);const f=await request.formData().catch(()=>new FormData());const back=String(f.get('return_to')||'/check-in');try{await checkinVn(s.token);return redirect(`${back}?success=${encodeURIComponent('Điểm danh thành công!')}`,303)}catch(e){return redirect(`${back}?error=${encodeURIComponent(e instanceof Error?e.message:'Không thể điểm danh.')}`,303)}};
