import type { APIRoute } from 'astro';
import { requireAdminSession } from '../../../../lib/auth';
import { getAdminSeriesList, supabasePatch, supabaseRpc } from '../../../../lib/supabase';
export const prerender=false;
const clean=(v:any)=>String(v||'').trim();
export const POST:APIRoute=async({request,cookies,redirect})=>{
  const adminSession=await requireAdminSession(cookies);
  if(!adminSession) return redirect('/login?next=/admin/series');
  const token=adminSession.token;
  try{
    const f=await request.formData();
    const action=clean(f.get('bulk_password_action'));
    const scope=clean(f.get('scope'))||'selected';
    const password=clean(f.get('bulk_password'));
    let ids=f.getAll('series_ids').map(clean).filter(Boolean);
    if(scope==='all') ids=(await getAdminSeriesList(token)).map(x=>x.id);
    ids=[...new Set(ids)];
    if(!ids.length) throw new Error('Hãy chọn ít nhất một truyện.');
    if(action==='set' && password.length<4) throw new Error('Mật khẩu chung cần ít nhất 4 ký tự.');
    if(!['set','clear'].includes(action)) throw new Error('Thao tác mật khẩu không hợp lệ.');

    // Password RPCs are existing server-side helpers. Run in small batches so a large
    // library does not create one long serial request chain.
    const batchSize=8;
    for(let i=0;i<ids.length;i+=batchSize){
      const batch=ids.slice(i,i+batchSize);
      await Promise.all(batch.map(id=>action==='set'
        ? supabaseRpc('admin_set_series_password',{p_series_id:id,p_password:password},token)
        : supabaseRpc('admin_clear_series_password',{p_series_id:id},token)));
    }
    // One REST update changes access mode for the whole selected set.
    const filter=ids.map(id=>`\"${id.replace(/\"/g,'')}\"`).join(',');
    await supabasePatch(`series?id=in.(${encodeURIComponent(filter)})`,token,{access_type:action==='set'?'password':'public'});
    const message=action==='set'?`Đã đặt mật khẩu chung cho ${ids.length} truyện.`:`Đã gỡ mật khẩu của ${ids.length} truyện.`;
    return redirect('/admin/series?success='+encodeURIComponent(message));
  }catch(e:any){return redirect('/admin/series?error='+encodeURIComponent(e?.message||'Không thể cập nhật mật khẩu hàng loạt.'));}
};
