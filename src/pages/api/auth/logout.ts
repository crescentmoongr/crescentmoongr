import type { APIRoute } from 'astro';
import { clearAuthCookies, getSession, revokeSession } from '../../../lib/auth';
export const prerender = false;
export const POST: APIRoute = async ({ cookies, redirect }) => {
  const session = await getSession(cookies);
  if (session) await revokeSession(session.token);
  clearAuthCookies(cookies);
  return redirect('/login?success=' + encodeURIComponent('Đã đăng xuất.'));
};
