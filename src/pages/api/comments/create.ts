import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { supabaseRpc } from '../../../lib/supabase';
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

    await supabaseRpc('create_pending_comment',{
      p_series_id:seriesId,
      p_body:body
    },session.token);
    return redirect(returnTo+'?comment=success#comments');
  }catch(e:any){
    const join=returnTo.includes('?')?'&':'?';
    return redirect(returnTo+join+'comment_error='+encodeURIComponent(e?.message||'Không thể gửi bình luận.')+'#comments');
  }
};
