import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { supabaseRpc, supabasePatch } from '../../../lib/supabase';
export const prerender=false;
export const POST:APIRoute=async({request,cookies})=>{
  const session=await getSession(cookies);
  if(!session)return new Response(JSON.stringify({ok:false}),{status:401,headers:{'content-type':'application/json'}});
  try{
    const data=await request.json().catch(()=>({}));
    if(data?.all) { await supabasePatch(`achievement_notifications?user_id=eq.${encodeURIComponent(session.user.id)}&is_read=eq.false`,session.token,{is_read:true}); await supabaseRpc('mark_all_my_comment_reply_notifications_read',{},session.token); await supabaseRpc('mark_all_my_comment_like_notifications_read',{},session.token); }
    else if(data?.type==='comment_like' && Number.isInteger(Number(data?.id)) && Number(data.id)>0) await supabaseRpc('mark_my_comment_like_notification_read',{p_id:Number(data.id)},session.token);
    else if(data?.type==='achievement' && Number.isInteger(Number(data?.id)) && Number(data.id)>0) await supabasePatch(`achievement_notifications?id=eq.${Number(data.id)}&user_id=eq.${encodeURIComponent(session.user.id)}`,session.token,{is_read:true});
    else if(Number.isInteger(Number(data?.id))&&Number(data.id)>0) await supabaseRpc('mark_my_comment_reply_notification_read',{p_id:Number(data.id)},session.token);
    return new Response(JSON.stringify({ok:true}),{headers:{'content-type':'application/json','cache-control':'no-store'}});
  }catch{return new Response(JSON.stringify({ok:false}),{status:400,headers:{'content-type':'application/json'}})}
};
