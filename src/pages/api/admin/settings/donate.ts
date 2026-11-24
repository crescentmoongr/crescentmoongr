import type {APIRoute} from 'astro';
import {requireAdminSession} from '../../../../lib/auth';
import {getServiceSiteSetting} from '../../../../lib/supabase';
import {env} from 'cloudflare:workers';
export const prerender=false;
const text=(form:FormData,key:string,max:number)=>String(form.get(key)||'').trim().slice(0,max);
export const POST:APIRoute=async({request,cookies})=>{
  const admin=await requireAdminSession(cookies);
  if(!admin)return new Response('Unauthorized',{status:401});
  const redirect=(key:string,message:string)=>Response.redirect(new URL(`/admin/donate?${key}=${encodeURIComponent(message)}`,request.url),303);
  try{
    const form=await request.formData();
    let old:any={};try{old=JSON.parse((await getServiceSiteSetting('donate_config'))?.value||'{}')}catch{}
    let qr=typeof old.qr==='string'?old.qr:'';
    const file=form.get('qr');
    if(file instanceof File && file.size>0){
      if(file.size>250*1024)throw new Error('Ảnh QR vượt quá 250 KB.');
      const bytes=new Uint8Array(await file.arrayBuffer());
      const png=bytes.length>8&&[137,80,78,71,13,10,26,10].every((b,i)=>bytes[i]===b);
      const jpg=bytes.length>3&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
      const webp=bytes.length>12&&String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';
      const mime=png?'image/png':jpg?'image/jpeg':webp?'image/webp':'';
      if(!mime)throw new Error('Chỉ chấp nhận ảnh QR PNG, JPG hoặc WebP hợp lệ.');
      let binary='';for(const b of bytes)binary+=String.fromCharCode(b);
      qr=`data:${mime};base64,${btoa(binary)}`;
    }
    const value=JSON.stringify({bank:text(form,'bank',100),holder:text(form,'holder',120),account:text(form,'account',40),enabled:form.get('enabled')==='1',qr});
    // Only a verified Admin may reach this point. Keep the service key server-side.
    const url=String(env.SUPABASE_URL||'').replace(/\/$/,'');
    const serviceKey=String(env.SUPABASE_SERVICE_ROLE_KEY||'').trim();
    if(!url||!serviceKey)throw new Error('Thiếu cấu hình Supabase service role trên Cloudflare.');
    const response=await fetch(`${url}/rest/v1/site_settings?on_conflict=key`,{
      method:'POST',
      headers:{
        apikey:serviceKey,
        Authorization:`Bearer ${serviceKey}`,
        'Content-Type':'application/json',
        Prefer:'resolution=merge-duplicates,return=minimal'
      },
      body:JSON.stringify({key:'donate_config',value,updated_at:new Date().toISOString()})
    });
    if(!response.ok)throw new Error(`Supabase ${response.status}: ${await response.text()}`);
    return redirect('success','Đã lưu Donate.');
  }catch(e:any){return redirect('error',e?.message||'Không lưu được Donate.');}
};
