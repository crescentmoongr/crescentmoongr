import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { getBookmark, supabaseDelete, supabasePost } from '../../../lib/supabase';
export const prerender=false;
export const POST:APIRoute=async({request,cookies,redirect})=>{
  const session=await getSession(cookies); const f=await request.formData();
  const seriesId=String(f.get('series_id')||''); const returnTo=String(f.get('return_to')||'/');
  if(!session) return redirect('/login?next='+encodeURIComponent(returnTo));
  if(!seriesId) return redirect(returnTo);
  const old=await getBookmark(seriesId,session.user.id,session.token);
  if(old) await supabaseDelete(`bookmarks?user_id=eq.${encodeURIComponent(session.user.id)}&series_id=eq.${encodeURIComponent(seriesId)}`,session.token);
  else await supabasePost('bookmarks',session.token,{user_id:session.user.id,series_id:seriesId});
  return redirect(returnTo);
};
