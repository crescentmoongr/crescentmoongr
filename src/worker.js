import { handle } from '@astrojs/cloudflare/handler';
import { processDueChapterNotifications } from './lib/chapterNotifier';

export default {
  fetch(request, env, ctx) {
    return handle(request, env, ctx);
  },
  scheduled(controller, env, ctx) {
    ctx.waitUntil(processDueChapterNotifications(env));
  }
};
