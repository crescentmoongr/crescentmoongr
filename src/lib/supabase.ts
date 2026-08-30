import { env } from 'cloudflare:workers';

export type Series = {
  id: string; title: string; slug: string; description: string | null;
  author: string | null; artist: string | null; cover_key: string | null;
  type: string | null; status: 'ongoing'|'completed'|'hiatus'|'dropped';
  is_published: boolean; created_at: string; updated_at: string;
};
export type Chapter = {
  id: string; series_id: string; chapter_number: number; title: string | null;
  access_type: 'public'|'password'|'member'; password_hash?: string | null;
  is_published: boolean; published_at: string | null; created_at: string; updated_at: string;
};
export type ChapterPage = { id: number; chapter_id: string; page_number: number; object_key: string; created_at: string };

function config(){
  const url=env.SUPABASE_URL, key=env.SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key) throw new Error('Thiếu SUPABASE_URL hoặc SUPABASE_PUBLISHABLE_KEY trên Cloudflare.');
  return {url:String(url).replace(/\/$/,''), key:String(key)};
}
async function req<T>(method:string,path:string, token?:string, body?:unknown):Promise<T>{
  const {url,key}=config();
  const r=await fetch(`${url}/rest/v1/${path}`,{
    method,
    headers:{apikey:key,Authorization:`Bearer ${token||key}`,Accept:'application/json','Content-Type':'application/json',Prefer:'return=representation'},
    body: body===undefined?undefined:JSON.stringify(body),
  });
  if(!r.ok){const d=await r.text(); throw new Error(`Supabase ${r.status}: ${d}`)}
  if(r.status===204) return undefined as T;
  const t=await r.text(); return (t?JSON.parse(t):undefined) as T;
}
export const supabaseGet=<T>(path:string,token?:string)=>req<T>('GET',path,token);
export const supabasePost=<T>(path:string,token:string,body:unknown)=>req<T>('POST',path,token,body);
export const supabasePatch=<T>(path:string,token:string,body:unknown)=>req<T>('PATCH',path,token,body);
export const supabaseDelete=<T>(path:string,token:string)=>req<T>('DELETE',path,token);

export async function getSeriesList(){return supabaseGet<Series[]>('series?select=*&is_published=eq.true&order=updated_at.desc')}
export async function getAdminSeriesList(token:string){return supabaseGet<Series[]>('series?select=*&order=updated_at.desc',token)}
export async function getSeriesBySlug(slug:string){const r=await supabaseGet<Series[]>(`series?select=*&slug=eq.${encodeURIComponent(slug)}&is_published=eq.true&limit=1`); return r[0]??null}
export async function getSeriesById(id:string){const r=await supabaseGet<Series[]>(`series?select=*&id=eq.${encodeURIComponent(id)}&is_published=eq.true&limit=1`); return r[0]??null}
export async function getAdminSeriesById(id:string,token:string){const r=await supabaseGet<Series[]>(`series?select=*&id=eq.${encodeURIComponent(id)}&limit=1`,token); return r[0]??null}
export async function getChapters(seriesId:string){return supabaseGet<Chapter[]>(`chapters?select=id,series_id,chapter_number,title,access_type,is_published,published_at,created_at,updated_at&series_id=eq.${encodeURIComponent(seriesId)}&is_published=eq.true&order=chapter_number.desc`)}
export async function getAdminChapters(seriesId:string,token:string){return supabaseGet<Chapter[]>(`chapters?select=*&series_id=eq.${encodeURIComponent(seriesId)}&order=chapter_number.desc`,token)}
export async function getChapter(seriesId:string,n:string){const r=await supabaseGet<Chapter[]>(`chapters?select=id,series_id,chapter_number,title,access_type,is_published,published_at,created_at,updated_at&series_id=eq.${encodeURIComponent(seriesId)}&chapter_number=eq.${encodeURIComponent(n)}&is_published=eq.true&limit=1`);return r[0]??null}
export async function getAdminChapter(id:string,token:string){const r=await supabaseGet<Chapter[]>(`chapters?select=*&id=eq.${encodeURIComponent(id)}&limit=1`,token);return r[0]??null}
export async function getPublicChapterPages(chapterId:string){return supabaseGet<ChapterPage[]>(`chapter_pages?select=id,chapter_id,page_number,object_key,created_at&chapter_id=eq.${encodeURIComponent(chapterId)}&order=page_number.asc`)}
export async function getAdminChapterPages(chapterId:string,token:string){return supabaseGet<ChapterPage[]>(`chapter_pages?select=*&chapter_id=eq.${encodeURIComponent(chapterId)}&order=page_number.asc`,token)}
export const statusLabel=(s:Series['status'])=>({ongoing:'Đang tiến hành',completed:'Hoàn thành',hiatus:'Tạm ngưng',dropped:'Drop'} as any)[s]??s;
export const accessLabel=(a:Chapter['access_type'])=>({public:'Public',password:'🔒 Mật khẩu',member:'🔒 Thành viên'} as any)[a]??a;
