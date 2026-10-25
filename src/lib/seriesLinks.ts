export const RAW_PLATFORMS=['CMOA','RENTA','LEZHIN','TAPPYTOON'] as const;
export type RawLink={platform:string;url:string};
export function parseRawLinks(form:FormData):RawLink[]{
 const names=form.getAll('raw_platform').map(String),urls=form.getAll('raw_link_url').map(String);
 if(names.length!==urls.length||names.length>20)throw new Error('Danh sách nền tảng không hợp lệ.');
 const seen=new Set<string>();const out:RawLink[]=[];
 for(let i=0;i<names.length;i++){
  const platform=names[i].trim(),raw=urls[i].trim();if(!raw)continue;
  if(!RAW_PLATFORMS.includes(platform as any)||seen.has(platform))throw new Error('Nền tảng mua raw không hợp lệ hoặc bị trùng.');
  let url:URL;try{url=new URL(raw)}catch{throw new Error('Link mua raw không hợp lệ.')}if(!['https:','http:'].includes(url.protocol))throw new Error('Link mua raw phải bắt đầu bằng https:// hoặc http://.');
  seen.add(platform);out.push({platform,url:url.href.slice(0,1000)});
 }return out;
}
export function parseRelatedSeries(form:FormData,selfId?:string):string[]{
 const values=form.getAll('related_series_id').map(x=>String(x).trim()).filter(Boolean);
 if(values.length>30||values.some(x=>! /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(x)||x===selfId)||new Set(values).size!==values.length)throw new Error('Danh sách truyện liên quan không hợp lệ.');
 return values;
}
export function displayRawLinks(s:any):RawLink[]{
 if(Array.isArray(s.raw_links)&&s.raw_links.length)return s.raw_links.filter((x:any)=>x&&RAW_PLATFORMS.includes(x.platform)&&typeof x.url==='string');
 return [{platform:'CMOA',url:s.raw_cmoa_url||s.raw_url},{platform:'RENTA',url:s.raw_renta_url}].filter(x=>x.url);
}
