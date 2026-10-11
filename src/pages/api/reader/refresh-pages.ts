import type { APIRoute } from 'astro';
import { getChapter, getSeriesBySlug, getPublicChapterPages } from '../../../lib/supabase';
import { getReaderSession, isSeriesUnlocked, signPageUrl } from '../../../lib/readerSecurity';
import { getSessionUser } from '../../../lib/auth';
export const prerender=false;
export const POST:APIRoute=async({request,cookies})=>{
  const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store'};
  const origin=request.headers.get('Origin');
  if(origin && origin!==new URL(request.url).origin)return new Response(JSON.stringify({error:'Forbidden'}),{status:403,headers});
  const session=getReaderSession(cookies);
  if(!session)return new Response(JSON.stringify({error:'Phiên đọc đã hết hạn. Hãy tải lại trang.'}),{status:401,headers});
  let data:any;
  try{data=await request.json()}catch{return new Response(JSON.stringify({error:'Yêu cầu không hợp lệ.'}),{status:400,headers})}
  const slug=String(data?.slug||'');const chapterNumber=String(data?.chapter||'');
  if(!slug||!chapterNumber||slug.length>200||chapterNumber.length>100)return new Response(JSON.stringify({error:'Yêu cầu không hợp lệ.'}),{status:400,headers});
  try{
    const series=await getSeriesBySlug(slug);
    const chapter=series?await getChapter(series.id,chapterNumber):null;
    if(!series||!chapter||String(series.type||'').toLowerCase()==='novel')return new Response(JSON.stringify({error:'Không tìm thấy chapter.'}),{status:404,headers});
    let allowed=series.access_type==='public';
    if(series.access_type==='password')allowed=await isSeriesUnlocked(cookies,series.id);
    if(series.access_type==='member')allowed=!!await getSessionUser(cookies);
    if(!allowed)return new Response(JSON.stringify({error:'Quyền đọc đã hết hạn. Hãy mở khóa hoặc đăng nhập lại.'}),{status:403,headers});
    const pages=await getPublicChapterPages(chapter.id);
    const signed=await Promise.all(pages.map(async p=>({id:String(p.id),url:await signPageUrl(p.id,series.id,chapter.id,session,300)})));
    return new Response(JSON.stringify({pages:signed}),{headers});
  }catch{return new Response(JSON.stringify({error:'Không thể cấp lại liên kết ảnh. Hãy thử lại.'}),{status:500,headers})}
};
