import type { APIRoute } from 'astro';
import { requireAdminSession } from '../../../../lib/auth';
import { supabaseRpc } from '../../../../lib/supabase';

export const prerender=false;
const clean=(v:any)=>String(v||'').trim();

export const POST:APIRoute=async({request,cookies,redirect})=>{
  const session=await requireAdminSession(cookies);
  if(!session)return redirect('/login?next=/admin');

  const f=await request.formData();
  try{
    const id=clean(f.get('id'))||null;
    const rawName=clean(f.get('name'));
    if(!rawName)throw new Error('Tên thể loại là bắt buộc.');

    // Editing an existing genre remains a single-item save.
    if(id){
      await supabaseRpc('admin_save_genre',{p_id:id,p_name:rawName},session.token);
      return redirect('/admin?success='+encodeURIComponent('Đã lưu thể loại.')+'#admin-genres');
    }

    // Creating genres supports comma-separated batch input.
    // Trim spaces, remove empty entries and duplicates in the same submission.
    const names=[...new Map(
      rawName
        .split(',')
        .map(name=>name.trim())
        .filter(Boolean)
        .map(name=>[name.toLocaleLowerCase('vi'),name])
    ).values()];

    if(!names.length)throw new Error('Tên thể loại là bắt buộc.');

    const errors:string[]=[];
    let saved=0;

    for(const name of names){
      try{
        await supabaseRpc('admin_save_genre',{p_id:null,p_name:name},session.token);
        saved++;
      }catch(e:any){
        // Existing genres or other DB validation errors shouldn't stop
        // the remaining items from being processed.
        errors.push(`${name}: ${e?.message||'không thể lưu'}`);
      }
    }

    if(saved===0 && errors.length){
      throw new Error(errors[0]);
    }

    const message=errors.length
      ? `Đã thêm ${saved} thể loại; ${errors.length} mục được bỏ qua.`
      : `Đã thêm ${saved} thể loại.`;

    return redirect('/admin?success='+encodeURIComponent(message)+'#admin-genres');
  }catch(e:any){
    return redirect('/admin?error='+encodeURIComponent(e?.message||'Không thể lưu thể loại.')+'#admin-genres');
  }
};
