import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { requireAdminSession } from '../../../../lib/auth';
import {
  getAdminChapter,
  getAdminChapterPages,
  getAdminSeriesById,
  supabaseDelete,
  supabasePost,
  type ChapterPage,
} from '../../../../lib/supabase';

export const prerender=false;

const mime:Record<string,string>={
  'image/jpeg':'jpg',
  'image/png':'png',
  'image/webp':'webp',
  'image/gif':'gif',
};
const clean=(v:any)=>String(v||'').trim();

export const POST:APIRoute=async({request,cookies,redirect})=>{
  const adminSession=await requireAdminSession(cookies);
  if(!adminSession)return redirect('/login?next=/admin');

  const token=adminSession.token;
  const form=await request.formData();
  const chapterId=clean(form.get('id'));
  const seriesId=clean(form.get('series_id'));
  const uploadedKeys:string[]=[];
  let oldPages:ChapterPage[]=[];
  let swapped=false;

  try{
    if(!chapterId||!seriesId)throw new Error('Thiếu thông tin chapter.');

    const [chapter,series]=await Promise.all([
      getAdminChapter(chapterId,token),
      getAdminSeriesById(seriesId,token),
    ]);
    if(!chapter||chapter.series_id!==seriesId)throw new Error('Không tìm thấy chapter.');
    if(!series)throw new Error('Không tìm thấy truyện.');
    if(String(series.type||'').toLowerCase()==='novel')throw new Error('Chapter Novel không dùng ảnh.');

    const files=form.getAll('pages').filter(x=>x instanceof File&&x.size) as File[];
    if(!files.length)throw new Error('Chưa chọn bộ ảnh mới.');

    files.sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true,sensitivity:'base'}));
    for(const file of files){
      if(file.size>15*1024*1024||!mime[file.type]){
        throw new Error(`File ${file.name} không hợp lệ hoặc vượt 15 MB.`);
      }
    }

    oldPages=await getAdminChapterPages(chapterId,token);
    if(!oldPages.length)throw new Error('Chapter hiện không có danh sách ảnh để thay.');

    // Upload to a brand-new revision path first. The old chapter stays readable
    // until every new image has uploaded successfully.
    const revision=`rev-${Date.now()}-${crypto.randomUUID().slice(0,8)}`;
    const newRows:{chapter_id:string;page_number:number;object_key:string}[]=[];

    for(let i=0;i<files.length;i++){
      const file=files[i];
      const key=`series/${seriesId}/chapters/${chapterId}/${revision}/${String(i+1).padStart(4,'0')}.${mime[file.type]}`;
      await env.MANGA_STORAGE.put(key,await file.arrayBuffer(),{
        httpMetadata:{contentType:file.type,cacheControl:'private, max-age=86400'},
        customMetadata:{originalName:file.name.slice(0,180),revision}
      });
      uploadedKeys.push(key);
      newRows.push({chapter_id:chapterId,page_number:i+1,object_key:key});
    }

    // Swap DB references only after all R2 uploads succeeded.
    // If the insert fails, restore the previous page rows below.
    await supabaseDelete(`chapter_pages?chapter_id=eq.${encodeURIComponent(chapterId)}`,token);
    try{
      await supabasePost<ChapterPage[]>('chapter_pages',token,newRows);
      swapped=true;
    }catch(insertError){
      const restoreRows=oldPages.map(p=>({
        chapter_id:p.chapter_id,
        page_number:p.page_number,
        object_key:p.object_key,
      }));
      if(restoreRows.length){
        try{await supabasePost<ChapterPage[]>('chapter_pages',token,restoreRows)}catch{}
      }
      throw insertError;
    }

    // New DB references are live. Old R2 objects are now unreferenced, so clean them up.
    // A cleanup failure does not break the chapter; it only leaves an orphan object.
    await Promise.allSettled(oldPages.map(p=>env.MANGA_STORAGE.delete(p.object_key)));

    return redirect(`/admin/series/${seriesId}?success=`+encodeURIComponent(`Đã thay toàn bộ ảnh Chapter ${chapter.chapter_number} (${files.length} ảnh).`));
  }catch(e:any){
    // If the DB swap never completed, remove the uploaded revision so failed attempts
    // do not consume R2 storage. If the swap completed, the new files are in use.
    if(!swapped){
      await Promise.allSettled(uploadedKeys.map(k=>env.MANGA_STORAGE.delete(k)));
    }
    return redirect(`/admin/series/${seriesId}?error=`+encodeURIComponent(e?.message||'Không thể thay ảnh chapter.'));
  }
};
