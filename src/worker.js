import { handle } from '@astrojs/cloudflare/handler';
import { processDueChapterNotifications, setNotifierRuntimeEnv } from './lib/chapterNotifier';

export default {
  async fetch(request, env, ctx) {
    setNotifierRuntimeEnv(env);
    const response = await handle(request, env, ctx);

    // HTML must be revalidated. This prevents a restored/long-lived tab from
    // keeping old Astro asset hashes after a new deployment. Hashed Astro
    // assets themselves remain safely cacheable for a long time.
    const url = new URL(request.url);
    const contentType = response.headers.get('content-type') || '';
    if (request.method === 'GET' && contentType.includes('text/html')) {
      const headers = new Headers(response.headers);
      headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      headers.set('Pragma', 'no-cache');
      headers.set('Expires', '0');
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    }
    if (request.method === 'GET' && url.pathname.startsWith('/_astro/')) {
      const headers = new Headers(response.headers);
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    }
    return response;
  },
  scheduled(controller, env, ctx) {
    setNotifierRuntimeEnv(env);
    ctx.waitUntil(processDueChapterNotifications(env));
  }
};
