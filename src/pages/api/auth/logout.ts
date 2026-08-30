import type { APIRoute } from 'astro';
export const prerender = false;

export const POST: APIRoute = async ({ cookies, redirect }) => {
  cookies.delete('cm_access_token', { path: '/' });
  return redirect('/login');
};
