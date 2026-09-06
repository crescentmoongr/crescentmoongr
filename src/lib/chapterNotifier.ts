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
const RUNTIME_ENV_KEY='__CRESCENT_CHAPTER_NOTIFIER_ENV__';

const clean=(v:any)=>String(v||'').trim();
const isoNow=()=>new Date().toISOString();

/**
 * Astro routes can import `env` from cloudflare:workers, but this project also
 * uses a custom Worker entrypoint for Cron.  Keep the actual `env` object from
 * the fetch/scheduled handler on globalThis so notification code always sees
 * the bindings attached to the active Worker version.
 */
export function setNotifierRuntimeEnv(runtimeEnv:NotifierEnv){
  (globalThis as any)[RUNTIME_ENV_KEY]=runtimeEnv;
}

function resolveEnv(explicit?:NotifierEnv):NotifierEnv{
  const injected=((globalThis as any)[RUNTIME_ENV_KEY]||{}) as NotifierEnv;
  let nodeEnv:any={};
  try{ nodeEnv=(globalThis as any).process?.env||{}; }catch{}
  const get=(key:keyof NotifierEnv)=>{
    const a=clean(explicit?.[key]);
    if(a)return a;
    const b=clean(injected?.[key]);
    if(b)return b;
    const c=clean(nodeEnv?.[key]);
    return c||undefined;
  };
  return {
    SUPABASE_URL:get('SUPABASE_URL'),
    SUPABASE_PUBLISHABLE_KEY:get('SUPABASE_PUBLISHABLE_KEY'),
    SUPABASE_SERVICE_ROLE_KEY:get('SUPABASE_SERVICE_ROLE_KEY'),
    DISCORD_WEBHOOK_URL:get('DISCORD_WEBHOOK_URL'),
    TELEGRAM_BOT_TOKEN:get('TELEGRAM_BOT_TOKEN'),
    TELEGRAM_CHAT_ID:get('TELEGRAM_CHAT_ID')
  };
}

const log=(...args:any[])=>console.info('[Chapter Notify]',...args);
const logError=(...args:any[])=>console.error('[Chapter Notify]',...args);

function configSummary(env:NotifierEnv){
  const e=resolveEnv(env);
  return {
    supabaseUrl:!!clean(e.SUPABASE_URL),
    serviceRoleKey:!!clean(e.SUPABASE_SERVICE_ROLE_KEY),
    discordWebhook:!!clean(e.DISCORD_WEBHOOK_URL),
    telegramBotToken:!!clean(e.TELEGRAM_BOT_TOKEN),
    telegramChatId:!!clean(e.TELEGRAM_CHAT_ID)
  };
}

function cfg(env:NotifierEnv){
  const e=resolveEnv(env);
  const url=clean(e.SUPABASE_URL).replace(/\/$/,'');
  const key=clean(e.SUPABASE_SERVICE_ROLE_KEY);
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
  const e=resolveEnv(env);
  const webhook=clean(e.DISCORD_WEBHOOK_URL);
  if(!webhook){log('Discord skipped: DISCORD_WEBHOOK_URL missing');return false;}
  log('Discord sending', {chapterId:ch.id, series:series.title, chapter:ch.chapter_number});
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
  log('Discord sent', {chapterId:ch.id,status:r.status});
  return true;
}

async function sendTelegram(env:NotifierEnv,series:NotifySeries,ch:DueChapter){
  const e=resolveEnv(env);
  const token=clean(e.TELEGRAM_BOT_TOKEN),chatId=clean(e.TELEGRAM_CHAT_ID);
  if(!token||!chatId){log('Telegram skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID missing',{botToken:!!token,chatId:!!chatId});return false;}
  log('Telegram sending', {chapterId:ch.id, series:series.title, chapter:ch.chapter_number});
  const {seriesUrl,coverUrl}=links(series,ch);
  const chapterTitle=ch.title?.trim();
  const chapterText=`Chapter ${ch.chapter_number}${chapterTitle?` - ${chapterTitle}`:''}`;
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
  log('Telegram sent', {chapterId:ch.id,status:r.status,endpoint});
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
  const e=resolveEnv(env);
  const rec=state.sent[ch.id]||{};
  let changed=false;
  if(!rec.discord&&clean(e.DISCORD_WEBHOOK_URL)){
    try{
      if(await sendDiscord(env,series,ch)){rec.discord=isoNow();changed=true;}
    }catch(e){logError('Discord notify failed',ch.id,e)}
  }
  if(!rec.telegram&&clean(e.TELEGRAM_BOT_TOKEN)&&clean(e.TELEGRAM_CHAT_ID)){
    try{
      if(await sendTelegram(env,series,ch)){rec.telegram=isoNow();changed=true;}
    }catch(e){logError('Telegram notify failed',ch.id,e)}
  }
  if(changed)state.sent[ch.id]=rec;
  return changed;
}

export async function notifyChapterById(env:NotifierEnv,chapterId:string){
  const e=resolveEnv(env);
  log('Immediate publish hook started',{chapterId,config:configSummary(e)});
  if(!clean(e.DISCORD_WEBHOOK_URL)&&!(clean(e.TELEGRAM_BOT_TOKEN)&&clean(e.TELEGRAM_CHAT_ID))){
    logError('No notification channel configured; skipping',{chapterId,config:configSummary(e)});
    return;
  }
  try{
    const state=await ensureState(e);
    log('Notification state ready',{chapterId,enabledAt:state.enabledAt,alreadySent:state.sent[chapterId]||null});
    const ch=await getChapter(e,chapterId);
    if(!ch){
      logError('Chapter not eligible/found. Check is_published and published_at.',{chapterId,now:isoNow()});
      return;
    }
    log('Chapter loaded',{chapterId,seriesId:ch.series_id,chapter:ch.chapter_number,publishedAt:ch.published_at});
    const series=await getSeries(e,ch.series_id);
    if(!series){logError('Series not found',{chapterId,seriesId:ch.series_id});return;}
    if(!series.is_published){logError('Series is not published; skipping',{chapterId,seriesId:ch.series_id,title:series.title});return;}
    log('Series loaded',{chapterId,seriesId:series.id,title:series.title});
    const changed=await deliver(e,state,series,ch);
    if(changed){
      await saveState(e,state);
      log('Immediate notification complete',{chapterId,sent:state.sent[chapterId]||null});
    }else{
      log('Nothing sent',{chapterId,alreadySent:state.sent[chapterId]||null,config:configSummary(e)});
    }
  }catch(e){
    logError('Immediate notifier crashed',{chapterId},e);
    throw e;
  }
}

export async function processDueChapterNotifications(env:NotifierEnv){
  const e=resolveEnv(env);
  log('Cron check started',{config:configSummary(e)});
  if(!clean(e.DISCORD_WEBHOOK_URL)&&!(clean(e.TELEGRAM_BOT_TOKEN)&&clean(e.TELEGRAM_CHAT_ID))){
    logError('Cron skipped: no notification channel configured',{config:configSummary(e)});
    return;
  }
  const state=await ensureState(e);
  const now=isoNow();
  const rows=await db<DueChapter[]>(e,'GET',`chapters?select=id,series_id,chapter_number,title,is_published,published_at,created_at&is_published=eq.true&published_at=gte.${encodeURIComponent(state.enabledAt)}&published_at=lte.${encodeURIComponent(now)}&order=published_at.desc&limit=50`);
  log('Cron due chapters found',{count:rows.length,enabledAt:state.enabledAt,now});
  let changed=false;
  const seriesCache=new Map<string,NotifySeries|null>();
  for(const ch of rows){
    const rec=state.sent[ch.id]||{};
    const needsDiscord=!!clean(e.DISCORD_WEBHOOK_URL)&&!rec.discord;
    const needsTelegram=!!clean(e.TELEGRAM_BOT_TOKEN)&&!!clean(e.TELEGRAM_CHAT_ID)&&!rec.telegram;
    if(!needsDiscord&&!needsTelegram)continue;
    let series=seriesCache.get(ch.series_id);
    if(series===undefined){series=await getSeries(e,ch.series_id);seriesCache.set(ch.series_id,series)}
    if(!series?.is_published)continue;
    if(await deliver(e,state,series,ch))changed=true
  }
  if(changed)await saveState(e,state);
}
