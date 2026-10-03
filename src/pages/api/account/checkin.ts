import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { checkinVn } from '../../../lib/supabase';
export const POST:APIRoute=async({request,cookies,redirect})=>{
  const wantsJson=(request.headers.get('accept')||'').includes('application/json');
  const s=await getSession(cookies);
  if(!s){if(wantsJson)return new Response(JSON.stringify({ok:false,error:'Vui lòng đăng nhập để điểm danh.'}),{status:401,headers:{'content-type':'application/json'}});return redirect('/login?next=/check-in',303)}
  const f=await request.formData().catch(()=>new FormData()); const back=String(f.get('return_to')||'/check-in');
  try{const rewards=await checkinVn(s.token);if(wantsJson)return new Response(JSON.stringify({ok:true,rewards}),{headers:{'content-type':'application/json','cache-control':'no-store'}});return redirect(`${back}?success=${encodeURIComponent('Điểm danh thành công!')}`,303)}
  catch(e){const message=e instanceof Error?e.message:'Không thể điểm danh.';if(wantsJson)return new Response(JSON.stringify({ok:false,error:message}),{status:400,headers:{'content-type':'application/json'}});return redirect(`${back}?error=${encodeURIComponent(message)}`,303)}
};
