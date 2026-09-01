import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { supabaseGet,supabasePost } from '../../../lib/supabase';
import { sanitizeCommentRichText } from '../../../lib/richText';

export const prerender=false;
const clean=(v:any)=>String(v||'').trim();
const safeReturn=(v:string)=>v.startsWith('/')&&!v.startsWith('//')?v:'/';

export const POST:APIRoute=async({request,cookies,redirect})=>{
  const session=await getSession(cookies);
  const form=await request.formData();
  const seriesId=clean(form.get('series_id'));
  const returnTo=safeReturn(clean(form.get('return_to')));
  if(!session)return redirect('/login?next='+encodeURIComponent(returnTo));
  try{
    const rawBody=clean(form.get('body'));
    const body=sanitizeCommentRichText(rawBody);
    const plainBody=body.replace(/<[^>]*>/g,' ').replace(/&nbsp;/gi,' ').replace(/\s+/g,' ').trim();
    if(!seriesId)throw new Error('Thiếu truyện.');
    if(!plainBody)throw new Error('Bình luận không được để trống.');
    if(plainBody.length>2000)throw new Error('Bình luận tối đa 2.000 ký tự.');

    const last=await supabaseGet<any[]>(`series_comments?select=created_at&user_id=eq.${encodeURIComponent(session.user.id)}&order=created_at.desc&limit=1`,session.token);
    if(last[0]&&Date.now()-new Date(last[0].created_at).getTime()<15000)throw new Error('Vui lòng chờ 15 giây trước khi bình luận tiếp.');

    await supabasePost('series_comments',session.token,{
      series_id:seriesId,
      user_id:session.user.id,
      body,
      moderation_status:'pending'
    });
    return redirect(returnTo+'?comment=success#comments');
  }catch(e:any){
    const join=returnTo.includes('?')?'&':'?';
    return redirect(returnTo+join+'comment_error='+encodeURIComponent(e?.message||'Không thể gửi bình luận.')+'#comments');
  }
};
