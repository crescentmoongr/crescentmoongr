import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { findServiceProfileByUsername } from '../../../lib/supabase';
export const prerender=false;
export const GET:APIRoute=async({url,cookies})=>{
  const session=await getSession(cookies);
  if(!session)return new Response(JSON.stringify({available:false}),{status:401,headers:{'content-type':'application/json'}});
  const username=String(url.searchParams.get('username')||'').trim().toLowerCase();
  if(!/^[a-z0-9_.-]{3,40}$/.test(username))return new Response(JSON.stringify({available:false}),{headers:{'content-type':'application/json'}});
  try{const existing=await findServiceProfileByUsername(username);return new Response(JSON.stringify({available:!existing||existing.id===session.user.id}),{headers:{'content-type':'application/json','cache-control':'no-store'}});}catch{return new Response(JSON.stringify({available:false}),{status:500,headers:{'content-type':'application/json'}});}
};
