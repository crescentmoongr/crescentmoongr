import { defineMiddleware } from 'astro:middleware';

const OLD_HOST = 'read.crescentmoonmanga.workers.dev';
const NEW_ORIGIN = 'https://crescentmoonmanga.com';

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);

  if (url.hostname.toLowerCase() === OLD_HOST) {
    const target = new URL(url.pathname + url.search, NEW_ORIGIN);
    return Response.redirect(target.toString(), 301);
  }

  return next();
});
