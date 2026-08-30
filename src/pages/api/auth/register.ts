import type { APIRoute } from 'astro';
import { signUpWithPassword, setAuthCookies } from '../../../lib/auth';
export const prerender = false;

function safeNext(value: string) { return value.startsWith('/') && !value.startsWith('//') ? value : ''; }

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const form = await request.formData();
  const email = String(form.get('email') || '').trim();
  const password = String(form.get('password') || '');
  const confirm = String(form.get('confirm_password') || '');
  const next = safeNext(String(form.get('next') || ''));
  const suffix = next ? `&next=${encodeURIComponent(next)}` : '';
  if (!email || !password) return redirect('/register?error=' + encodeURIComponent('Vui lòng nhập đủ email và mật khẩu.') + suffix);
  if (password.length < 8) return redirect('/register?error=' + encodeURIComponent('Mật khẩu cần ít nhất 8 ký tự.') + suffix);
  if (password !== confirm) return redirect('/register?error=' + encodeURIComponent('Hai mật khẩu không khớp.') + suffix);
  try {
    const data = await signUpWithPassword(email, password);
    if (data.access_token && data.refresh_token) {
      await setAuthCookies(cookies, data);
      return redirect(next || '/account?success=' + encodeURIComponent('Đăng ký thành công.'));
    }
    return redirect('/login?success=' + encodeURIComponent('Đã tạo tài khoản. Hãy xác nhận email nếu Supabase yêu cầu, sau đó đăng nhập.') + suffix);
  } catch (error: any) {
    return redirect('/register?error=' + encodeURIComponent(error?.message || 'Đăng ký thất bại.') + suffix);
  }
};
