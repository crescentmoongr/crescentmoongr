import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { supabaseDelete } from '../../../lib/supabase';

export const prerender=false;
const clean=(v:any)=>String(v||'').trim();
const safeReturn=(v:string)=>v.startsWith('/')&&!v.startsWith('//')?v:'/';

export const POST:APIRoute=async({request,cookies,redirect})=>{
  const session=await getSession(cookies);
  const form=await request.formData();
  const returnTo=safeReturn(clean(form.get('return_to')));
  if(!session)return redirect('/login?next='+encodeURIComponent(returnTo));
  try{
    const id=clean(form.get('id'));
    if(!id)throw new Error('Thiếu bình luận.');
    // RLS allows the owner or an admin to delete.
    await supabaseDelete(`series_comments?id=eq.${encodeURIComponent(id)}`,session.token);
    return redirect(returnTo+'#comments');
  }catch(e:any){
    const join=returnTo.includes('?')?'&':'?';
    return redirect(returnTo+join+'comment_error='+encodeURIComponent(e?.message||'Không thể xóa bình luận.')+'#comments');
  }
};
