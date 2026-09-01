function hex(buf:ArrayBuffer){return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('')}
export async function hashChapterPassword(password:string){
  const salt=crypto.getRandomValues(new Uint8Array(16));
  const s=hex(salt.buffer);
  const data=new TextEncoder().encode(`${s}:${password}`);
  const digest=await crypto.subtle.digest('SHA-256',data);
  return `v1$${s}$${hex(digest)}`;
}
