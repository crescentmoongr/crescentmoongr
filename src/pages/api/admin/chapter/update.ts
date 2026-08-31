import type { APIRoute } from 'astro';
import { requireAdminSession } from '../../../../lib/auth';
import { getAdminSeriesById,supabasePatch } from '../../../../lib/supabase';
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
    let is_published=mode!=='draft';
    let published_at:any=null;
    if(mode==='publish')published_at=new Date().toISOString();
    else if(mode==='schedule'){
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
    return redirect(`/admin/series/${sid}?success=`+encodeURIComponent('Đã lưu chapter.'));
  }catch(e:any){
    return redirect(`/admin/series/${sid}?error=`+encodeURIComponent(e?.message||'Không thể lưu chapter.'));
  }
};
