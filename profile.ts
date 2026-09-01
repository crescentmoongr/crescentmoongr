import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { supabasePatch } from '../../../lib/supabase';
export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const session = await getSession(cookies);
  if (!session) return redirect('/login?next=/account');
  const form = await request.formData();
  const displayName = String(form.get('display_name') || '').trim().slice(0,80);
  const usernameRaw = String(form.get('username') || '').trim().toLowerCase();
  const username = usernameRaw ? usernameRaw.replace(/[^a-z0-9_.-]/g,'').slice(0,40) : null;
  try {
    await supabasePatch(`profiles?id=eq.${encodeURIComponent(session.user.id)}`, session.token, {
      display_name: displayName || null,
      username,
      updated_at: new Date().toISOString(),
    });
    return redirect('/account?success=' + encodeURIComponent('Đã lưu hồ sơ.'));
  } catch (e:any) {
    return redirect('/account?error=' + encodeURIComponent(e?.message || 'Không thể lưu hồ sơ.'));
  }
};
