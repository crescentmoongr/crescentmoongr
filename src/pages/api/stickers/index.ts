import type {APIRoute} from 'astro';import {getStickers} from '../../../lib/stickers';
export const prerender=false;export const GET:APIRoute=async()=>new Response(JSON.stringify((await getStickers()).filter(x=>x.enabled).sort((a,b)=>a.order-b.order).map(x=>({id:x.id,url:`/api/stickers/${x.id}`}))),{headers:{'content-type':'application/json; charset=utf-8','cache-control':'public, max-age=60'}});
