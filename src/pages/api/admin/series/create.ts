import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { requireAdminSession } from '../../../../lib/auth';
import { sanitizeRichText } from '../../../../lib/richText';
import { supabasePost, supabaseDelete, supabaseRpc, getAuthors, type Series } from '../../../../lib/supabase';
export const prerender=false;
const validStatus=new Set(['ongoing','completed','hiatus','dropped']);
const validAccess=new Set(['public','password','member']);
const validMime:Record<string,string>={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif'};
const clean=(v:FormDataEntryValue|null)=>String(v||'').trim();
const safeSlug=(v:string)=>v.toLowerCase().trim().replace(/[^a-z0-9-]+/g,'-').replace(/-+/g,'-').replace(/^-+|-+$/g,'');
const safeUrl=(v:string)=>{if(!v)return null;try{const u=new URL(v);if(!['http:','https:'].includes(u.protocol))throw 0;return u.href.slice(0,1000)}catch{throw new Error('Link mua raw không hợp lệ. Hãy dùng URL bắt đầu bằng http:// hoặc https://.')}};
export const POST:APIRoute=async({request,cookies,redirect})=>{
  const adminSession=await requireAdminSession(cookies); if(!adminSession) return redirect('/login?next=/admin'); const token=adminSession.token;
  let coverKey=''; let seriesId='';
  try{
    const f=await request.formData(); const selectedGenres=f.getAll('genres').map(x=>clean(x)).filter(Boolean); const title=clean(f.get('title')); const slug=safeSlug(clean(f.get('slug'))); const status=clean(f.get('status')); const access=clean(f.get('access_type'))||'public'; const password=clean(f.get('series_password')); const rawUrl=safeUrl(clean(f.get('raw_url')));
    if(!title||!slug) throw new Error('Tên truyện và slug là bắt buộc.'); if(!validStatus.has(status)) throw new Error('Trạng thái không hợp lệ.'); if(!validAccess.has(access)) throw new Error('Quyền đọc không hợp lệ.'); if(access==='password'&&password.length<4) throw new Error('Mật khẩu truyện cần ít nhất 4 ký tự.');
    const authorName=clean(f.get('author'));
    if(authorName){
      const existingAuthors=await getAuthors();
      const exists=existingAuthors.some(a=>a.name.trim().toLocaleLowerCase('vi-VN')===authorName.toLocaleLowerCase('vi-VN'));
      if(!exists) await supabaseRpc('admin_save_author',{p_id:null,p_name:authorName,p_x_url:null},token);
    }
    const cover=f.get('cover'); if(!(cover instanceof File)||!cover.size) throw new Error('Vui lòng chọn ảnh bìa.'); if(cover.size>8*1024*1024||!validMime[cover.type]) throw new Error('Ảnh bìa không hợp lệ hoặc vượt 8 MB.');
    coverKey=`covers/${crypto.randomUUID()}.${validMime[cover.type]}`; await env.MANGA_STORAGE.put(coverKey,await cover.arrayBuffer(),{httpMetadata:{contentType:cover.type,cacheControl:'public, max-age=86400'},customMetadata:{originalName:cover.name.slice(0,180)}});
    const rows=await supabasePost<Series[]>('series',token,{title,slug,description:sanitizeRichText(clean(f.get('description')))||null,author:authorName||null,artist:clean(f.get('artist'))||null,raw_url:rawUrl,genres:selectedGenres,cover_key:coverKey,type:clean(f.get('type'))||null,status,is_published:f.get('is_published')==='true',access_type:access});
    const s=rows[0]; if(!s) throw new Error('Không tạo được truyện.'); seriesId=s.id;
    if(access==='password') await supabaseRpc('admin_set_series_password',{p_series_id:s.id,p_password:password},token);
    return redirect('/admin?success='+encodeURIComponent(`Đã thêm truyện "${title}".`));
  }catch(e:any){ if(seriesId) try{await supabaseDelete(`series?id=eq.${encodeURIComponent(seriesId)}`,token)}catch{} if(coverKey) try{await env.MANGA_STORAGE.delete(coverKey)}catch{} return redirect('/admin?error='+encodeURIComponent(e?.message||'Không thể thêm truyện.')); }
};
