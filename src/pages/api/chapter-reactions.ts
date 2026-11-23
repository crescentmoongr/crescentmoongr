import type {APIRoute} from 'astro';
import {getSession} from '../../lib/auth';
import {getPublicChapterById,supabaseRpc} from '../../lib/supabase';
export const prerender=false;
const keys=['support','happy','love','surprised','angry','sad'];
const json=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
export const GET:APIRoute=async({url,cookies})=>{
  const id=url.searchParams.get('chapter_id')||'';
  if(!/^[0-9a-f-]{36}$/i.test(id))return json({error:'Chapter không hợp lệ.'},400);
  try{
    if(!await getPublicChapterById(id))return json({error:'Không tìm thấy chapter.'},404);
    const session=await getSession(cookies);
    const result=await supabaseRpc<any>('get_chapter_reactions',{p_chapter_id:id},session?.token);
    return json(result);
  }catch(e){console.error('[chapter-reactions GET]',e instanceof Error?e.message:'unknown');return json({error:'Chưa tải được cảm xúc. Kiểm tra SQL v13.31.'},500)}
};
export const POST:APIRoute=async({request,cookies})=>{
  if(request.headers.get('origin')&&request.headers.get('origin')!==new URL(request.url).origin)return json({error:'Yêu cầu không hợp lệ.'},403);
  const session=await getSession(cookies).catch(()=>null);
  if(!session)return json({error:'Vui lòng đăng nhập.'},401);
  let data:any;try{data=await request.json()}catch{return json({error:'Dữ liệu không hợp lệ.'},400)}
  const id=String(data?.chapter_id||''),reaction=String(data?.reaction||'');
  if(!/^[0-9a-f-]{36}$/i.test(id)||!keys.includes(reaction))return json({error:'Cảm xúc không hợp lệ.'},400);
  try{
    if(!await getPublicChapterById(id))return json({error:'Không tìm thấy chapter.'},404);
    const result=await supabaseRpc<any>('toggle_chapter_reaction',{p_chapter_id:id,p_reaction:reaction},session.token);
    return json(result);
  }catch(e){console.error('[chapter-reactions POST]',e instanceof Error?e.message:'unknown');return json({error:'Không thể lưu cảm xúc. Kiểm tra SQL v13.31.'},500)}
};
