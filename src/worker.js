import { handle } from '@astrojs/cloudflare/handler';
import { processDueChapterNotifications, setNotifierRuntimeEnv } from './lib/chapterNotifier';

export default {
  fetch(request, env, ctx) {
    setNotifierRuntimeEnv(env);
    return handle(request, env, ctx);
  },
  scheduled(controller, env, ctx) {
    setNotifierRuntimeEnv(env);
    ctx.waitUntil(processDueChapterNotifications(env));
  }
};
