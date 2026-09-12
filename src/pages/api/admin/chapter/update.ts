import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { requireAdminSession } from '../../../../lib/auth';
import { getAdminChapter,getAdminSeriesById,supabasePatch } from '../../../../lib/supabase';
import { sanitizeNovelRichText } from '../../../../lib/richText';

export const prerender=false;
const clean=(v:any)=>String(v||'').trim();

export const POST:APIRoute=async({request,cookies,redirect})=>{
  const s=await requireAdminSession(cookies);
  if(!s)return redirect('/login?next=/admin');
  const f=await request.formData();
  const id=clean(f.get('id')),sid=clean(f.get('series_id'));
  try{
    const n=Number(clean(f.get('chapter_number')));
    if(!Number.isFinite(n))throw new Error('Số chapter không hợp lệ.');
    const mode=clean(f.get('publish_mode'))||'draft';
    const existing=await getAdminChapter(id,s.token);
    if(!existing||existing.series_id!==sid)throw new Error('Không tìm thấy chapter.');

    const nowMs=Date.now();
    const oldPublishedMs=existing.published_at?Date.parse(existing.published_at):NaN;
    const wasLive=!!existing.is_published && (!existing.published_at || (Number.isFinite(oldPublishedMs) && oldPublishedMs<=nowMs));

    let is_published=mode!=='draft';
    let published_at:any=existing.published_at||null;
    if(mode==='publish'){
      // Editing an already-live chapter must NOT make it "new" again.
      // Keep its original published_at. Only a draft/future-scheduled chapter
      // that is being published now receives a new publication timestamp.
      published_at=wasLive?(existing.published_at||existing.created_at):new Date().toISOString();
    }else if(mode==='schedule'){
      const raw=clean(f.get('published_at'));
      const d=new Date(raw);
      if(!raw||!Number.isFinite(d.getTime())||d.getTime()<=Date.now())throw new Error('Giờ lên lịch phải ở tương lai.');
      published_at=d.toISOString();
    }

    const series=await getAdminSeriesById(sid,s.token);
    if(!series)throw new Error('Không tìm thấy truyện.');
    const patch:any={chapter_number:n,title:clean(f.get('title'))||null,is_published,published_at};
    if(String(series.type||'').toLowerCase()==='novel'){
      const html=sanitizeNovelRichText(clean(f.get('content_html')));
      if(!html)throw new Error('Nội dung chapter Novel không được để trống.');
      patch.content_html=html;
    }

    await supabasePatch(`chapters?id=eq.${encodeURIComponent(id)}&series_id=eq.${encodeURIComponent(sid)}`,s.token,patch);
    console.info('[Chapter Notify] update.ts saved',{chapterId:id,mode,wasLive,publishedAt:published_at,notifyEligible:mode==='publish'&&!wasLive});
    return redirect(`/admin/series/${sid}?success=`+encodeURIComponent('Đã lưu chapter.'));
  }catch(e:any){
    return redirect(`/admin/series/${sid}?error=`+encodeURIComponent(e?.message||'Không thể lưu chapter.'));
  }
};
