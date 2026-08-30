import type { APIRoute } from 'astro';
import { getSession, updateAuthPassword } from '../../../lib/auth';
export const prerender = false;
export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const session = await getSession(cookies);
  if (!session) return redirect('/login?next=/account');
  const form = await request.formData();
  const password = String(form.get('password') || '');
  const confirm = String(form.get('confirm_password') || '');
  if (password.length < 8) return redirect('/account?error=' + encodeURIComponent('Mật khẩu mới cần ít nhất 8 ký tự.'));
  if (password !== confirm) return redirect('/account?error=' + encodeURIComponent('Hai mật khẩu mới không khớp.'));
  try {
    await updateAuthPassword(session.token, password);
    return redirect('/account?success=' + encodeURIComponent('Đã đổi mật khẩu.'));
  } catch (e:any) {
    return redirect('/account?error=' + encodeURIComponent(e?.message || 'Không thể đổi mật khẩu.'));
  }
};
