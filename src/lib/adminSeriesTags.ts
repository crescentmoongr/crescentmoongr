import {getTags,supabaseRpc} from './supabase';
const key=(name:string)=>name.trim().toLocaleLowerCase('vi');
export async function ensureAdminSeriesTags(values:string[],token:string):Promise<string[]>{
 const unique=[...new Map(values.map(x=>x.trim()).filter(Boolean).map(x=>[key(x),x])).values()];
 if(unique.some(x=>x.length>120))throw new Error('Mỗi Tag chỉ được dài tối đa 120 ký tự.');
 if(unique.length>60)throw new Error('Mỗi truyện chỉ được chọn tối đa 60 Tag.');
 const existing=await getTags(token);const names=new Map(existing.map(x=>[key(x.name),x.name]));
 const output:string[]=[];
 for(const name of unique){
   const k=key(name);
   if(names.has(k)){output.push(names.get(k)!);continue;}
   try{await supabaseRpc('admin_save_tag',{p_id:null,p_name:name},token);names.set(k,name);output.push(name);}
   catch(e:any){
     // A concurrent request may have created this Tag first. Resolve it by name.
     if(/23505|duplicate key|already exists/i.test(String(e?.message||''))){
       const refreshed=await getTags(token);const match=refreshed.find(x=>key(x.name)===k);
       if(match){names.set(k,match.name);output.push(match.name);continue;}
     }
     throw new Error(`Không thể tạo Tag "${name}": ${String(e?.message||'Lỗi không xác định')}`);
   }
 }
 return output;
}
