import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { getAllPublicChapters,getSeriesList,supabaseRpc } from '../../../lib/supabase';
export const prerender=false;

export const GET:APIRoute=async({cookies})=>{
  try{
    const session=await getSession(cookies);
    const replyPromise=session
      ? supabaseRpc<any[]>('get_my_comment_reply_notifications',{p_limit:20},session.token).catch(()=>[])
      : Promise.resolve([]);
    const [chapters,series,replies]=await Promise.all([getAllPublicChapters(),getSeriesList(),replyPromise]);
    const seriesMap=new Map(series.map(s=>[s.id,s]));
    const cutoff=Date.now()-7*24*60*60*1000;
    const chapterItems=chapters.filter(ch=>{
      const d=ch.published_at||ch.created_at;
      return d&&new Date(d).getTime()>=cutoff&&seriesMap.has(ch.series_id);
    }).slice(0,20).map(ch=>{
      const s=seriesMap.get(ch.series_id)!;
      return {id:`chapter:${ch.id}`,type:'chapter_update',title:s.title,chapter_number:ch.chapter_number,chapter_title:ch.title,
        href:`/read/${s.slug}/${ch.chapter_number}`,cover:s.cover_key?`/api/cover/${s.id}`:null,
        created_at:ch.published_at||ch.created_at,is_read:false};
    });
    const replyItems=(replies||[]).map((n:any)=>({
      id:`reply:${n.id}`,notification_id:n.id,type:'comment_reply',actor_name:n.actor_name||'Thành viên',
      title:n.series_title||'Truyện',preview:n.reply_preview||'',href:`/manga/${n.series_slug}#comment-${n.comment_id}`,
      cover:n.actor_user_id?`/api/avatar/${encodeURIComponent(n.actor_user_id)}`:null,
      created_at:n.created_at,is_read:!!n.is_read
    }));
    const items=[...replyItems,...chapterItems].sort((a:any,b:any)=>new Date(b.created_at).getTime()-new Date(a.created_at).getTime()).slice(0,30);
    return new Response(JSON.stringify({items}),{headers:{'content-type':'application/json; charset=utf-8','cache-control':'private, no-store'}});
  }catch{
    return new Response(JSON.stringify({items:[]}),{headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
  }
};
