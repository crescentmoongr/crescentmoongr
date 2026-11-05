export const prerender = false;
export const GET = () => new Response(JSON.stringify({version:'13.08'}), {
  headers: {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store, no-cache, must-revalidate','CDN-Cache-Control':'no-store','Cloudflare-CDN-Cache-Control':'no-store'}
});
