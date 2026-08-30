import type { APIRoute } from 'astro';
import { signInWithPassword, getAdminFromToken } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const form = await request.formData();
  const email = String(form.get('email') || '').trim();
  const password = String(form.get('password') || '');

  if (!email || !password) {
    return redirect('/login?error=' + encodeURIComponent('Vui lòng nhập email và mật khẩu.'));
  }

  try {
    const session = await signInWithPassword(email, password);
    const admin = await getAdminFromToken(session.access_token);

    if (!admin) {
      return redirect('/login?error=' + encodeURIComponent('Tài khoản này không có quyền admin.'));
    }

    cookies.set('cm_access_token', session.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: Math.min(Number(session.expires_in || 3600), 3600),
    });

    return redirect('/admin');
  } catch (error: any) {
    return redirect('/login?error=' + encodeURIComponent(error?.message || 'Đăng nhập thất bại.'));
  }
};
