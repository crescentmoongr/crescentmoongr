import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { requireAdminSession } from '../../../../lib/auth';
import { sanitizeRichText } from '../../../../lib/richText';
import { getAdminSeriesById, hasAdminSeriesPassword, supabasePatch, supabaseRpc, getAuthors } from '../../../../lib/supabase';
export const prerender=false;
const mime:Record<string,string>={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif'};
const clean=(v:any)=>String(v||'').trim(); const safeSlug=(s:string)=>s.toLowerCase().trim().replace(/[^a-z0-9-]+/g,'-').replace(/-+/g,'-').replace(/^-+|-+$/g,'');
const safeUrl=(v:string)=>{if(!v)return null;try{const u=new URL(v);if(!['http:','https:'].includes(u.protocol))throw 0;return u.href.slice(0,1000)}catch{throw new Error('Link mua raw không hợp lệ. Hãy dùng URL bắt đầu bằng http:// hoặc https://.')}};
export const POST:APIRoute=async({request,cookies,redirect})=>{
  const adminSession=await requireAdminSession(cookies); if(!adminSession) return redirect('/login?next=/admin'); const token=adminSession.token; const f=await request.formData(); const selectedGenres=f.getAll('genres').map(x=>clean(x)).filter(Boolean); const id=clean(f.get('id')); let newCover='';
  try{
    const old=await getAdminSeriesById(id,token); if(!old) throw new Error('Không tìm thấy truyện.'); const access=clean(f.get('access_type'))||'public'; if(!['public','password','member'].includes(access)) throw new Error('Quyền đọc không hợp lệ.'); const password=clean(f.get('series_password'));
    if(access==='password'&&!password&&!await hasAdminSeriesPassword(id,token)) throw new Error('Hãy nhập mật khẩu cho truyện.');
    let coverKey=old.cover_key; const cover=f.get('cover'); if(cover instanceof File&&cover.size){if(cover.size>8*1024*1024||!mime[cover.type]) throw new Error('Ảnh bìa không hợp lệ hoặc vượt 8 MB.'); newCover=`covers/${crypto.randomUUID()}.${mime[cover.type]}`; await env.MANGA_STORAGE.put(newCover,await cover.arrayBuffer(),{httpMetadata:{contentType:cover.type,cacheControl:'public, max-age=86400'}}); coverKey=newCover;}
    const title=clean(f.get('title')), slug=safeSlug(clean(f.get('slug'))), rawUrl=safeUrl(clean(f.get('raw_url'))), authorName=clean(f.get('author')); if(!title||!slug) throw new Error('Tên và slug là bắt buộc.');
    if(authorName){
      const existingAuthors=await getAuthors();
      const exists=existingAuthors.some(a=>a.name.trim().toLocaleLowerCase('vi-VN')===authorName.toLocaleLowerCase('vi-VN'));
      if(!exists) await supabaseRpc('admin_save_author',{p_id:null,p_name:authorName,p_x_url:null},token);
    }
    if(access==='password'&&password) await supabaseRpc('admin_set_series_password',{p_series_id:id,p_password:password},token);
    await supabasePatch(`series?id=eq.${encodeURIComponent(id)}`,token,{title,slug,description:sanitizeRichText(clean(f.get('description')))||null,author:authorName||null,artist:clean(f.get('artist'))||null,raw_url:rawUrl,genres:selectedGenres,type:clean(f.get('type'))||null,status:clean(f.get('status')),is_published:f.get('is_published')==='true',cover_key:coverKey,access_type:access});
    if(access!=='password') await supabaseRpc('admin_clear_series_password',{p_series_id:id},token);
    if(newCover&&old.cover_key) await env.MANGA_STORAGE.delete(old.cover_key);
    return redirect(`/admin/series/${id}?success=`+encodeURIComponent('Đã lưu thay đổi.'));
  }catch(e:any){if(newCover) try{await env.MANGA_STORAGE.delete(newCover)}catch{} return redirect(`/admin/series/${id}?error=`+encodeURIComponent(e?.message||'Không thể cập nhật.'));}
};
