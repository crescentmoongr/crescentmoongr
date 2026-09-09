import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { toggleSeriesFavorite } from '../../../lib/supabase';

export const prerender=false;

export const POST:APIRoute=async({request,cookies,redirect})=>{
  const session=await getSession(cookies);
  const form=await request.formData();
  const seriesId=String(form.get('series_id')||'').trim();
  const returnTo=String(form.get('return_to')||'/').trim()||'/';

  if(!session) return redirect('/login?next='+encodeURIComponent(returnTo));
  if(!seriesId) return redirect(returnTo);

  try{
    await toggleSeriesFavorite(seriesId,session.token);
  }catch(err){
    console.error('[Favorite] toggle failed',seriesId,err);
  }
  return redirect(returnTo);
};
