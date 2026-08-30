import type { APIRoute } from 'astro';
import { signInWithPassword, setAuthCookies, getSession } from '../../../lib/auth';
export const prerender = false;

function safeNext(value: string) {
  return value.startsWith('/') && !value.startsWith('//') ? value : '';
}

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const form = await request.formData();
  const email = String(form.get('email') || '').trim();
  const password = String(form.get('password') || '');
  const next = safeNext(String(form.get('next') || ''));
  if (!email || !password) return redirect('/login?error=' + encodeURIComponent('Vui lòng nhập email và mật khẩu.') + (next ? `&next=${encodeURIComponent(next)}` : ''));
  try {
    const auth = await signInWithPassword(email, password);
    await setAuthCookies(cookies, auth);
    const session = await getSession(cookies);
    if (!session) throw new Error('Không thể tạo phiên đăng nhập.');
    return redirect(next || (session.user.role === 'admin' ? '/admin' : '/account'));
  } catch (error: any) {
    return redirect('/login?error=' + encodeURIComponent(error?.message || 'Đăng nhập thất bại.') + (next ? `&next=${encodeURIComponent(next)}` : ''));
  }
};
