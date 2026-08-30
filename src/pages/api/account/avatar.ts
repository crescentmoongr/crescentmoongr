import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getSession } from '../../../lib/auth';
import { supabaseGet, supabasePatch } from '../../../lib/supabase';
export const prerender = false;
const ext: Record<string,string> = {'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const session = await getSession(cookies);
  if (!session) return redirect('/login?next=/account');
  const form = await request.formData();
  const file = form.get('avatar');
  if (!(file instanceof File) || !file.size) return redirect('/account?error=' + encodeURIComponent('Chưa chọn ảnh avatar.'));
  if (!ext[file.type] || file.size > 2 * 1024 * 1024) return redirect('/account?error=' + encodeURIComponent('Avatar chỉ nhận JPG, PNG, WebP và tối đa 2 MB.'));
  try {
    const rows = await supabaseGet<any[]>(`profiles?id=eq.${encodeURIComponent(session.user.id)}&select=avatar_key&limit=1`, session.token);
    const oldKey = rows[0]?.avatar_key || '';
    const key = `avatars/${session.user.id}/avatar-${Date.now()}.${ext[file.type]}`;
    await env.MANGA_STORAGE.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type, cacheControl: 'private, max-age=86400' } });
    try {
      await supabasePatch(`profiles?id=eq.${encodeURIComponent(session.user.id)}`, session.token, { avatar_key: key, updated_at: new Date().toISOString() });
    } catch (e) {
      await env.MANGA_STORAGE.delete(key); throw e;
    }
    if (oldKey && oldKey !== key) try { await env.MANGA_STORAGE.delete(oldKey); } catch {}
    return redirect('/account?success=' + encodeURIComponent('Đã cập nhật avatar.'));
  } catch (e:any) {
    return redirect('/account?error=' + encodeURIComponent(e?.message || 'Không thể cập nhật avatar.'));
  }
};
