import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { getReadingHistory, supabaseDelete, supabasePatch, supabasePost } from '../../../lib/supabase';
export const prerender=false;
export const POST:APIRoute=async({request,cookies})=>{
  const session=await getSession(cookies); if(!session) return new Response(null,{status:204});
  let data:any={}; try{data=await request.json()}catch{return new Response(null,{status:400})}
  const seriesId=String(data.series_id||''), chapterId=String(data.chapter_id||''); if(!seriesId||!chapterId) return new Response(null,{status:400});
  const old=await getReadingHistory(seriesId,session.user.id,session.token);
  if(old) await supabasePatch(`reading_history?user_id=eq.${encodeURIComponent(session.user.id)}&series_id=eq.${encodeURIComponent(seriesId)}`,session.token,{chapter_id:chapterId,updated_at:new Date().toISOString()});
  else await supabasePost('reading_history',session.token,{user_id:session.user.id,series_id:seriesId,chapter_id:chapterId});
  // Idempotent read mark without relying on a pre-existing unique constraint.
  const found=await (await import('../../../lib/supabase')).supabaseGet<any[]>(`chapter_reads?select=chapter_id&user_id=eq.${encodeURIComponent(session.user.id)}&chapter_id=eq.${encodeURIComponent(chapterId)}&limit=1`,session.token);
  if(!found[0]) await supabasePost('chapter_reads',session.token,{user_id:session.user.id,series_id:seriesId,chapter_id:chapterId});
  return new Response(null,{status:204});
};
