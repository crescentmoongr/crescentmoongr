import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { supabaseGet } from '../../../lib/supabase';
export const prerender=false;

const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});

export const POST:APIRoute=async({cookies})=>{
  try{
    let sid=cookies.get('cm_presence')?.value;
    if(!sid){
      sid=crypto.randomUUID();
      cookies.set('cm_presence',sid,{path:'/',httpOnly:true,sameSite:'lax',secure:true,maxAge:60*60*24*30});
    }
    await env.SESSION.put(`presence:${sid}`,'1',{expirationTtl:180});
    return new Response(null,{status:204,headers:{'cache-control':'no-store'}});
  }catch{return new Response(null,{status:204})}
};

export const GET:APIRoute=async()=>{
  try{
    const now=new Date();
    const today=now.toISOString().slice(0,10);
    const monthStart=`${today.slice(0,7)}-01`;
    const [todayRows,monthRows,totalRows,presence]=await Promise.all([
      supabaseGet<any[]>(`site_daily_views?select=view_count&view_date=eq.${today}`),
      supabaseGet<any[]>(`site_daily_views?select=view_count&view_date=gte.${monthStart}&view_date=lte.${today}`),
      supabaseGet<any[]>('chapter_stats?select=view_count'),
      env.SESSION.list({prefix:'presence:'})
    ]);
    const sum=(rows:any[])=>rows.reduce((n,x)=>n+Number(x.view_count||0),0);
    return json({now:presence.keys.length,today:sum(todayRows),month:sum(monthRows),total:sum(totalRows)});
  }catch{return json({now:0,today:0,month:0,total:0},500)}
};
