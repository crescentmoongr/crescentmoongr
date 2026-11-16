import type {APIRoute} from 'astro';
import {getSession} from '../../../lib/auth';
import {getSeriesComments,getCommentLikeStates,supabaseRpc} from '../../../lib/supabase';
export const prerender=false;
export const POST:APIRoute=async({request,cookies})=>{
  const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
  const fail=(code:string,message:string,status=500)=>json({error:message,code},status);
  const report=(stage:string,error:unknown)=>{
    // Never log JWTs, cookies, raw request bodies or member identifiers.
    const detail=error instanceof Error?error.message:String(error);
    console.error('[comments/like]',stage,detail.slice(0,500));
  };
  try{
    const origin=request.headers.get('origin');
    if(origin&&origin!==new URL(request.url).origin)return fail('LIKE_INVALID_ORIGIN','Yêu cầu không hợp lệ.',403);
    let session:Awaited<ReturnType<typeof getSession>>;
    try{session=await getSession(cookies);}catch(e){report('SESSION_LOOKUP_FAILED',e);return fail('LIKE_SESSION_LOOKUP_FAILED','Không thể kiểm tra phiên đăng nhập. Vui lòng thử lại.');}
    if(!session)return fail('LIKE_UNAUTHENTICATED','Vui lòng đăng nhập.',401);
    let input:any;
    try{input=await request.json();}catch{return fail('LIKE_INVALID_JSON','Dữ liệu không hợp lệ.',400);}
    const commentId=Number(input?.comment_id);
    const seriesId=String(input?.series_id||'');
    if(!Number.isSafeInteger(commentId)||commentId<=0||!seriesId||seriesId.length>100)return fail('LIKE_INVALID_INPUT','Dữ liệu không hợp lệ.',400);
    let comments:Awaited<ReturnType<typeof getSeriesComments>>;
    try{comments=await getSeriesComments(seriesId);}catch(e){report('COMMENTS_LOOKUP_FAILED',e);return fail('LIKE_COMMENTS_LOOKUP_FAILED','Không thể kiểm tra bình luận. Vui lòng thử lại.');}
    if(!Array.isArray(comments))return fail('LIKE_COMMENTS_INVALID_RESPONSE','Không thể kiểm tra bình luận. Vui lòng thử lại.');
    if(!comments.some(c=>Number(c.id)===commentId))return fail('LIKE_COMMENT_NOT_FOUND','Không tìm thấy bình luận.',404);
    let liked:boolean;
    try{liked=await supabaseRpc<boolean>('toggle_comment_like',{p_comment_id:commentId},session.token);}
    catch(e){report('TOGGLE_RPC_FAILED',e);return fail('LIKE_TOGGLE_FAILED','Không thể lưu lượt thích. Vui lòng thử lại.');}
    try{
      const states=await getCommentLikeStates([commentId],session.user.id);
      return json({liked:!!liked,count:states[commentId]?.count||0});
    }catch(e){
      report('COUNT_LOOKUP_FAILED_AFTER_TOGGLE',e);
      // Toggle succeeded: never tell the reader to retry and accidentally undo it.
      return json({liked:!!liked,count:null,count_unavailable:true});
    }
  }catch(e){report('UNEXPECTED_FAILURE',e);return fail('LIKE_UNEXPECTED_FAILED','Không thể cập nhật lượt thích. Vui lòng thử lại.');}
};
