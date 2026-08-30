# Crescent Reader v4

Astro + Cloudflare Workers + Supabase + private R2.

## v4
- Admin đã có form Thêm truyện.
- Upload ảnh bìa trực tiếp vào private R2 bucket qua binding `MANGA_STORAGE`.
- Lưu `cover_key` vào Supabase `series`.
- Trang chủ và trang truyện đọc ảnh bìa qua Worker, R2 vẫn để Public Access = Disabled.
- `wrangler.jsonc` đã có `keep_vars: true` để giữ `SUPABASE_URL` khi GitHub deploy.
- Có `supabase-v4-admin-policies.sql` cần chạy một lần trong Supabase SQL Editor trước khi dùng form thêm truyện.

## Cloudflare runtime
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- R2 binding `MANGA_STORAGE` -> `manga-storage`
