import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getAdminFromToken } from '../../../../lib/auth';
import { supabasePost, type Series } from '../../../../lib/supabase';

export const prerender = false;

const validStatus = new Set(['ongoing', 'completed', 'hiatus', 'dropped']);
const validMime: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

function clean(value: FormDataEntryValue | null) {
  return String(value || '').trim();
}

function safeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const token = cookies.get('cm_access_token')?.value || '';
  const admin = await getAdminFromToken(token);
  if (!admin) return redirect('/login');

  try {
    const form = await request.formData();

    const title = clean(form.get('title'));
    const slug = safeSlug(clean(form.get('slug')));
    const description = clean(form.get('description')) || null;
    const author = clean(form.get('author')) || null;
    const artist = clean(form.get('artist')) || null;
    const type = clean(form.get('type')) || null;
    const status = clean(form.get('status'));
    const is_published = form.get('is_published') === 'true';
    const cover = form.get('cover');

    if (!title || !slug) throw new Error('Tên truyện và slug là bắt buộc.');
    if (!validStatus.has(status)) throw new Error('Trạng thái không hợp lệ.');
    if (!(cover instanceof File) || cover.size === 0) throw new Error('Vui lòng chọn ảnh bìa.');
    if (cover.size > 8 * 1024 * 1024) throw new Error('Ảnh bìa vượt quá 8 MB.');

    const extension = validMime[cover.type];
    if (!extension) throw new Error('Ảnh bìa chỉ hỗ trợ JPG, PNG, WebP hoặc GIF.');

    const objectKey = `covers/${crypto.randomUUID()}.${extension}`;

    await env.MANGA_STORAGE.put(objectKey, await cover.arrayBuffer(), {
      httpMetadata: {
        contentType: cover.type,
        cacheControl: 'public, max-age=86400',
      },
      customMetadata: {
        originalName: cover.name.slice(0, 180),
      },
    });

    try {
      const inserted = await supabasePost<Series[]>('series', token, {
        title,
        slug,
        description,
        author,
        artist,
        cover_key: objectKey,
        type,
        status,
        is_published,
      });

      if (!inserted[0]) throw new Error('Supabase không trả về truyện vừa tạo.');
    } catch (error) {
      await env.MANGA_STORAGE.delete(objectKey);
      throw error;
    }

    return redirect('/admin?success=' + encodeURIComponent(`Đã thêm truyện "${title}".`));
  } catch (error: any) {
    const message = error?.message || 'Không thể thêm truyện.';
    return redirect('/admin?error=' + encodeURIComponent(message));
  }
};
