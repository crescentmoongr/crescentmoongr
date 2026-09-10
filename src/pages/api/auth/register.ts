import type { APIRoute } from 'astro';
import { signUpWithPassword, setAuthCookies } from '../../../lib/auth';
import { findServiceProfileByUsername, setServiceProfileUsername } from '../../../lib/supabase';
export const prerender = false;

function safeNext(value: string) { return value.startsWith('/') && !value.startsWith('//') ? value : ''; }

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const form = await request.formData();
  const usernameRaw = String(form.get('username') || '').trim().toLowerCase();
  const username = usernameRaw.replace(/[^a-z0-9_.-]/g,'').slice(0,40);
  const email = String(form.get('email') || '').trim();
  const password = String(form.get('password') || '');
  const confirm = String(form.get('confirm_password') || '');
  const next = safeNext(String(form.get('next') || ''));
  const suffix = next ? `&next=${encodeURIComponent(next)}` : '';
  if (!username || username.length < 3 || username !== usernameRaw) return redirect('/register?error=' + encodeURIComponent('Username cần 3–40 ký tự và chỉ dùng chữ cái, số, dấu chấm, gạch dưới hoặc gạch ngang.') + suffix);
  if (!email || !password) return redirect('/register?error=' + encodeURIComponent('Vui lòng nhập đủ username, email và mật khẩu.') + suffix);
  if (password.length < 8) return redirect('/register?error=' + encodeURIComponent('Mật khẩu cần ít nhất 8 ký tự.') + suffix);
  if (password !== confirm) return redirect('/register?error=' + encodeURIComponent('Hai mật khẩu không khớp.') + suffix);
  try {
    const existing = await findServiceProfileByUsername(username);
    if (existing) return redirect('/register?error=' + encodeURIComponent('Username này đã được sử dụng. Hãy chọn username khác.') + suffix);
    const data = await signUpWithPassword(email, password);
    const userId = String(data?.user?.id || '');
    if (userId) await setServiceProfileUsername(userId, username);
    if (data.access_token && data.refresh_token) {
      await setAuthCookies(cookies, data);
      return redirect(next || '/account?success=' + encodeURIComponent('Đăng ký thành công.'));
    }
    return redirect('/login?success=' + encodeURIComponent('Đã tạo tài khoản. Hãy xác nhận email nếu Supabase yêu cầu, sau đó đăng nhập.') + suffix);
  } catch (error: any) {
    return redirect('/register?error=' + encodeURIComponent(error?.message || 'Đăng ký thất bại.') + suffix);
  }
};
