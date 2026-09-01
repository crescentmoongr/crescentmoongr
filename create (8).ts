import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { requireAdminSession } from '../../../../lib/auth';
import { getAdminChapters,getAdminSeriesById,supabasePost,supabaseDelete,type Chapter,type ChapterPage } from '../../../../lib/supabase';
import { sanitizeNovelRichText } from '../../../../lib/richText';

export const prerender=false;
const mime:Record<string,string>={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif'};
const clean=(v:any)=>String(v||'').trim();

export const POST:APIRoute=async({request,cookies,redirect})=>{
  const adminSession=await requireAdminSession(cookies);
  if(!adminSession)return redirect('/login?next=/admin');
  const token=adminSession.token;
  const f=await request.formData();
  const sid=clean(f.get('series_id'));
  const uploaded:string[]=[];
  let chapterId='';

  try{
    const series=await getAdminSeriesById(sid,token);
    if(!series)throw new Error('Không tìm thấy truyện.');
    const isNovel=String(series.type||'').toLowerCase()==='novel';

    const n=Number(clean(f.get('chapter_number')));
    if(!Number.isFinite(n))throw new Error('Số chapter không hợp lệ.');

    let contentHtml:string|null=null;
    let files:File[]=[];
    if(isNovel){
      contentHtml=sanitizeNovelRichText(clean(f.get('content_html')));
      if(!contentHtml)throw new Error('Chưa nhập nội dung chapter Novel.');
      if(contentHtml.length>500000)throw new Error('Nội dung chapter quá dài.');
    }else{
      files=f.getAll('pages').filter(x=>x instanceof File&&x.size) as File[];
      if(!files.length)throw new Error('Chưa chọn ảnh chapter.');
      files.sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true,sensitivity:'base'}));
      for(const x of files){
        if(x.size>15*1024*1024||!mime[x.type])throw new Error(`File ${x.name} không hợp lệ hoặc vượt 15 MB.`);
      }
    }

    const mode=clean(f.get('publish_mode'))||'publish';
    let isPublished=mode!=='draft';
    let publishedAt:string|null=null;
    if(mode==='schedule'){
      const raw=clean(f.get('published_at'));
      const d=new Date(raw);
      if(!raw||!Number.isFinite(d.getTime())||d.getTime()<=Date.now())throw new Error('Giờ lên lịch phải ở tương lai.');
      publishedAt=d.toISOString();
    }else if(mode==='publish') publishedAt=new Date().toISOString();

    const existing=await getAdminChapters(sid,token);
    const maxSort=Math.max(0,...existing.map(x=>Number(x.sort_order||0)));
    const rows=await supabasePost<Chapter[]>('chapters',token,{
      series_id:sid,chapter_number:n,title:clean(f.get('title'))||null,
      access_type:'public',password_hash:null,is_published:isPublished,
      published_at:publishedAt,sort_order:maxSort+1000,content_html:contentHtml
    });
    const ch=rows[0];
    if(!ch)throw new Error('Không tạo được chapter.');
    chapterId=ch.id;

    if(!isNovel){
      const pageRows=[];
      for(let i=0;i<files.length;i++){
        const x=files[i];
        const key=`series/${sid}/chapters/${ch.id}/${String(i+1).padStart(4,'0')}.${mime[x.type]}`;
        await env.MANGA_STORAGE.put(key,await x.arrayBuffer(),{
          httpMetadata:{contentType:x.type,cacheControl:'private, max-age=86400'},
          customMetadata:{originalName:x.name.slice(0,180)}
        });
        uploaded.push(key);
        pageRows.push({chapter_id:ch.id,page_number:i+1,object_key:key});
      }
      if(pageRows.length)await supabasePost<ChapterPage[]>('chapter_pages',token,pageRows);
    }

    const label=mode==='draft'?'Draft':mode==='schedule'?'đã lên lịch':'Published';
    return redirect(`/admin/series/${sid}?success=`+encodeURIComponent(`Đã tạo chapter ${n} · ${label}.`));
  }catch(e:any){
    for(const k of uploaded)try{await env.MANGA_STORAGE.delete(k)}catch{}
    if(chapterId)try{await supabaseDelete(`chapters?id=eq.${encodeURIComponent(chapterId)}`,token)}catch{}
    return redirect(`/admin/series/${sid}?error=`+encodeURIComponent(e?.message||'Không thể tạo chapter.'));
  }
};
