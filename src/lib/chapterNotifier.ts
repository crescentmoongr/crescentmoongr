export type NotifierEnv = {
  SUPABASE_URL?: string;
  SUPABASE_PUBLISHABLE_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  DISCORD_WEBHOOK_URL?: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
};

type NotifyState = {
  enabledAt: string;
  sent: Record<string,{discord?:string;telegram?:string}>;
};

type DueChapter = {
  id:string;
  series_id:string;
  chapter_number:number;
  title:string|null;
  is_published:boolean;
  published_at:string|null;
  created_at:string;
};

type NotifySeries = {
  id:string;
  title:string;
  slug:string;
  cover_key:string|null;
  is_published:boolean;
};

const STATE_KEY='chapter_notify_state_v1';
const SITE_ORIGIN='https://crescentmoonmanga.com';

const clean=(v:any)=>String(v||'').trim();
const isoNow=()=>new Date().toISOString();

function cfg(env:NotifierEnv){
  const url=clean(env.SUPABASE_URL).replace(/\/$/,'');
  const key=clean(env.SUPABASE_SERVICE_ROLE_KEY);
  if(!url||!key)throw new Error('Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY.');
  return {url,key};
}

async function db<T>(env:NotifierEnv,method:string,path:string,body?:unknown):Promise<T>{
  const {url,key}=cfg(env);
  const r=await fetch(`${url}/rest/v1/${path}`,{
    method,
    headers:{
      apikey:key,
      Authorization:`Bearer ${key}`,
      Accept:'application/json',
      'Content-Type':'application/json',
      Prefer:'return=representation'
    },
    body:body===undefined?undefined:JSON.stringify(body)
  });
  if(!r.ok)throw new Error(`Notifier Supabase ${r.status}: ${await r.text()}`);
  if(r.status===204)return undefined as T;
  const text=await r.text();
  return (text?JSON.parse(text):undefined) as T;
}

async function loadState(env:NotifierEnv):Promise<NotifyState|null>{
  const rows=await db<any[]>(env,'GET',`site_settings?select=key,value&key=eq.${encodeURIComponent(STATE_KEY)}&limit=1`);
  if(!rows[0]?.value)return null;
  try{
    const x=JSON.parse(rows[0].value);
    if(!x||typeof x!=='object'||typeof x.enabledAt!=='string'||!x.sent||typeof x.sent!=='object')return null;
    return {enabledAt:x.enabledAt,sent:x.sent};
  }catch{return null}
}

function pruneState(state:NotifyState){
  const entries=Object.entries(state.sent);
  if(entries.length<=500)return state;
  entries.sort((a,b)=>{
    const ta=Math.max(Date.parse(a[1].discord||'')||0,Date.parse(a[1].telegram||'')||0);
    const tb=Math.max(Date.parse(b[1].discord||'')||0,Date.parse(b[1].telegram||'')||0);
    return tb-ta;
  });
  state.sent=Object.fromEntries(entries.slice(0,500));
  return state;
}

async function saveState(env:NotifierEnv,state:NotifyState){
  pruneState(state);
  const value=JSON.stringify(state);
  const existing=await db<any[]>(env,'GET',`site_settings?select=key&key=eq.${encodeURIComponent(STATE_KEY)}&limit=1`);
  if(existing[0])await db(env,'PATCH',`site_settings?key=eq.${encodeURIComponent(STATE_KEY)}`,{value,updated_at:isoNow()});
  else await db(env,'POST','site_settings',{key:STATE_KEY,value,updated_at:isoNow()});
}

async function ensureState(env:NotifierEnv){
  let state=await loadState(env);
  if(state)return state;
  state={enabledAt:isoNow(),sent:{}};
  await saveState(env,state);
  return state;
}

function escHtml(s:string){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));}

function links(series:NotifySeries,ch:DueChapter){
  const seriesUrl=`${SITE_ORIGIN}/manga/${encodeURIComponent(series.slug)}`;
  const chapterUrl=`${SITE_ORIGIN}/read/${encodeURIComponent(series.slug)}/${encodeURIComponent(String(ch.chapter_number))}`;
  const coverUrl=series.cover_key?`${SITE_ORIGIN}/api/cover/${encodeURIComponent(series.id)}`:'';
  return {seriesUrl,chapterUrl,coverUrl};
}

async function sendDiscord(env:NotifierEnv,series:NotifySeries,ch:DueChapter){
  const webhook=clean(env.DISCORD_WEBHOOK_URL);
  if(!webhook)return false;
  const {seriesUrl,chapterUrl,coverUrl}=links(series,ch);
  const chapterText=`Chapter ${ch.chapter_number}${ch.title?` — ${ch.title}`:''}`;
  const payload:any={
    content:'@everyone',
    allowed_mentions:{parse:['everyone']},
    embeds:[{
      author:{name:'🌙 Trăng vừa cập nhật chương mới nè'},
      title:`📚 ${series.title}`,
      url:seriesUrl,
      description:`✨ **${chapterText} đã được đăng!**\n\n👉 [Đọc chapter mới tại đây](${chapterUrl})`,
      color:12093439,
      timestamp:ch.published_at||new Date().toISOString(),
      footer:{text:'🌙 Crescent Moon • Chúc bạn đọc truyện vui vẻ!'}
    }]
  };
  if(coverUrl)payload.embeds[0].thumbnail={url:coverUrl};
  const r=await fetch(webhook,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
  if(!r.ok)throw new Error(`Discord ${r.status}: ${await r.text()}`);
  return true;
}

async function sendTelegram(env:NotifierEnv,series:NotifySeries,ch:DueChapter){
  const token=clean(env.TELEGRAM_BOT_TOKEN),chatId=clean(env.TELEGRAM_CHAT_ID);
  if(!token||!chatId)return false;
  const {seriesUrl,coverUrl}=links(series,ch);
  const chapterText=ch.title?.trim()||`Chapter ${ch.chapter_number}`;
  const caption=`📚 <b><a href="${seriesUrl}">${escHtml(series.title)}</a></b>

✨ <b>${escHtml(chapterText)}</b> đã được cập nhật!

🌙 Crescent Moon • Chúc bạn đọc truyện vui vẻ!`;
  const base=`https://api.telegram.org/bot${token}`;
  const body:any={chat_id:chatId,parse_mode:'HTML'};
  let endpoint='sendMessage';
  if(coverUrl){
    endpoint='sendPhoto';
    body.photo=coverUrl;
    body.caption=caption;
    body.show_caption_above_media=false;
  }else{
    body.text=caption;
  }
  const r=await fetch(`${base}/${endpoint}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
  if(!r.ok)throw new Error(`Telegram ${r.status}: ${await r.text()}`);
  return true;
}

async function getSeries(env:NotifierEnv,id:string){
  const rows=await db<NotifySeries[]>(env,'GET',`series?select=id,title,slug,cover_key,is_published&id=eq.${encodeURIComponent(id)}&limit=1`);
  return rows[0]||null;
}

async function getChapter(env:NotifierEnv,id:string){
  const now=encodeURIComponent(isoNow());
  const rows=await db<DueChapter[]>(env,'GET',`chapters?select=id,series_id,chapter_number,title,is_published,published_at,created_at&id=eq.${encodeURIComponent(id)}&is_published=eq.true&published_at=lte.${now}&limit=1`);
  return rows[0]||null;
}

async function deliver(env:NotifierEnv,state:NotifyState,series:NotifySeries,ch:DueChapter){
  const rec=state.sent[ch.id]||{};
  let changed=false;
  if(!rec.discord&&clean(env.DISCORD_WEBHOOK_URL)){
    try{
      if(await sendDiscord(env,series,ch)){rec.discord=isoNow();changed=true;}
    }catch(e){console.error('Discord notify failed',ch.id,e)}
  }
  if(!rec.telegram&&clean(env.TELEGRAM_BOT_TOKEN)&&clean(env.TELEGRAM_CHAT_ID)){
    try{
      if(await sendTelegram(env,series,ch)){rec.telegram=isoNow();changed=true;}
    }catch(e){console.error('Telegram notify failed',ch.id,e)}
  }
  if(changed)state.sent[ch.id]=rec;
  return changed;
}

export async function notifyChapterById(env:NotifierEnv,chapterId:string){
  if(!clean(env.DISCORD_WEBHOOK_URL)&&!(clean(env.TELEGRAM_BOT_TOKEN)&&clean(env.TELEGRAM_CHAT_ID)))return;
  const state=await ensureState(env);
  const ch=await getChapter(env,chapterId);
  if(!ch)return;
  const series=await getSeries(env,ch.series_id);
  if(!series?.is_published)return;
  if(await deliver(env,state,series,ch))await saveState(env,state);
}

export async function processDueChapterNotifications(env:NotifierEnv){
  if(!clean(env.DISCORD_WEBHOOK_URL)&&!(clean(env.TELEGRAM_BOT_TOKEN)&&clean(env.TELEGRAM_CHAT_ID)))return;
  const state=await ensureState(env);
  const now=isoNow();
  const rows=await db<DueChapter[]>(env,'GET',`chapters?select=id,series_id,chapter_number,title,is_published,published_at,created_at&is_published=eq.true&published_at=gte.${encodeURIComponent(state.enabledAt)}&published_at=lte.${encodeURIComponent(now)}&order=published_at.desc&limit=50`);
  let changed=false;
  const seriesCache=new Map<string,NotifySeries|null>();
  for(const ch of rows){
    const rec=state.sent[ch.id]||{};
    const needsDiscord=!!clean(env.DISCORD_WEBHOOK_URL)&&!rec.discord;
    const needsTelegram=!!clean(env.TELEGRAM_BOT_TOKEN)&&!!clean(env.TELEGRAM_CHAT_ID)&&!rec.telegram;
    if(!needsDiscord&&!needsTelegram)continue;
    let series=seriesCache.get(ch.series_id);
    if(series===undefined){series=await getSeries(env,ch.series_id);seriesCache.set(ch.series_id,series)}
    if(!series?.is_published)continue;
    if(await deliver(env,state,series,ch))changed=true
  }
  if(changed)await saveState(env,state);
}
