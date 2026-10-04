import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { supabaseRpc } from '../../../lib/supabase';
export const prerender=false;
export const POST:APIRoute=async({request,cookies})=>{
  const session=await getSession(cookies);
  if(!session)return new Response(JSON.stringify({ok:false}),{status:401,headers:{'content-type':'application/json'}});
  try{
    const data=await request.json().catch(()=>({}));
    if(data?.all) await supabaseRpc('mark_all_my_comment_reply_notifications_read',{},session.token);
    else if(Number.isInteger(Number(data?.id))&&Number(data.id)>0) await supabaseRpc('mark_my_comment_reply_notification_read',{p_id:Number(data.id)},session.token);
    return new Response(JSON.stringify({ok:true}),{headers:{'content-type':'application/json','cache-control':'no-store'}});
  }catch{return new Response(JSON.stringify({ok:false}),{status:400,headers:{'content-type':'application/json'}})}
};
