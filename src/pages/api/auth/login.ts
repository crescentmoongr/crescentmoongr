import type { APIRoute } from 'astro';
import { signInWithPassword, setAuthCookies, getSession } from '../../../lib/auth';
export const prerender = false;

// Translate known Supabase credential failures without exposing raw backend messages.
function loginErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error || '');
  if (/invalid login credentials|invalid credentials|email or password (?:is )?(?:invalid|incorrect)|invalid email or password|email hoặc mật khẩu không đúng/i.test(message)) {
    return 'Tài khoản hoặc mật khẩu không đúng. Vui lòng kiểm tra lại nhé!';
  }
  if (message === 'Không thể tạo phiên đăng nhập.') return message;
  if (/thiếu cấu hình supabase|thiếu khóa ký session/i.test(message)) return 'Hệ thống đăng nhập đang gặp sự cố. Vui lòng thử lại sau.';
  return 'Không thể đăng nhập lúc này. Vui lòng thử lại sau.';
}

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
    if (!String(session.user.username||'').trim()) return redirect('/');
    return redirect(next || (session.user.role === 'admin' ? '/admin' : '/account'));
  } catch (error: any) {
    return redirect('/login?error=' + encodeURIComponent(loginErrorMessage(error)) + (next ? `&next=${encodeURIComponent(next)}` : ''));
  }
};
