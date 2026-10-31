import type {APIRoute} from 'astro';
import {getSession} from '../../../lib/auth';
import {getSeriesComments,getCommentLikeStates,supabaseRpc} from '../../../lib/supabase';
export const prerender=false;
export const POST:APIRoute=async({request,cookies})=>{
  const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
  const origin=request.headers.get('origin');
  if(origin&&origin!==new URL(request.url).origin)return json({error:'Yêu cầu không hợp lệ.'},403);
  const session=await getSession(cookies);
  if(!session)return json({error:'Vui lòng đăng nhập.'},401);
  try{
    const input=await request.json();
    const commentId=Number(input?.comment_id);
    const seriesId=String(input?.series_id||'');
    if(!Number.isSafeInteger(commentId)||commentId<=0||!seriesId||seriesId.length>100)return json({error:'Dữ liệu không hợp lệ.'},400);
    const comments=await getSeriesComments(seriesId);
    if(!comments.some(c=>Number(c.id)===commentId))return json({error:'Không tìm thấy bình luận.'},404);
    const liked=await supabaseRpc<boolean>('toggle_comment_like',{p_comment_id:commentId},session.token);
    const states=await getCommentLikeStates([commentId],session.user.id);
    return json({liked:!!liked,count:states[commentId]?.count||0});
  }catch(e){return json({error:'Không thể cập nhật lượt thích. Vui lòng thử lại.'},500);}
};
