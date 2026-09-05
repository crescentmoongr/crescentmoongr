import type { APIRoute } from 'astro';
import { getAllPublicChapters,getSeriesList } from '../../../lib/supabase';

export const prerender=false;

export const GET:APIRoute=async()=>{
  try{
    const [chapters,series]=await Promise.all([getAllPublicChapters(),getSeriesList()]);
    const seriesMap=new Map(series.map(s=>[s.id,s]));
    const cutoff=Date.now()-7*24*60*60*1000;
    const recentChapters=chapters
      .filter(ch=>{
        const d=ch.published_at||ch.created_at;
        return d&&new Date(d).getTime()>=cutoff&&seriesMap.has(ch.series_id);
      });
    const ids=recentChapters.map(ch=>ch.id).slice(0,300);
    const items=recentChapters
      .slice(0,20)
      .map(ch=>{
        const s=seriesMap.get(ch.series_id)!;
        return {
          id:ch.id,
          title:s.title,
          chapter_number:ch.chapter_number,
          chapter_title:ch.title,
          href:`/read/${s.slug}/${ch.chapter_number}`,
          cover:s.cover_key?`/api/cover/${s.id}`:null,
          published_at:ch.published_at||ch.created_at
        };
      });

    return new Response(JSON.stringify({items,ids}),{
      headers:{
        'content-type':'application/json; charset=utf-8',
        'cache-control':'public, max-age=60, s-maxage=60'
      }
    });
  }catch{
    return new Response(JSON.stringify({items:[],ids:[]}),{
      headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}
    });
  }
};
