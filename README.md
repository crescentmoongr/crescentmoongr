# Crescent Reader v5

Có thêm sửa/xóa truyện, quản lý chapter, upload nhiều ảnh chapter vào private R2, Public/Password/Member, sửa/xóa chapter, và reader hiển thị ảnh cho chapter Public.

## Trước khi dùng
Chạy `supabase-v5-chapter-policies.sql` một lần trong Supabase SQL Editor.

## Cloudflare
Giữ `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` và binding `MANGA_STORAGE`. `wrangler.jsonc` đã có `keep_vars: true`.
