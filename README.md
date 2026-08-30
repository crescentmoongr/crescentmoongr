# Crescent Reader v2

Astro + Cloudflare Workers + Supabase + private Cloudflare R2.

## v2 đã nối
- `series` từ Supabase
- `chapters` từ Supabase
- trạng thái khóa `public/password/member`
- R2 binding `MANGA_STORAGE` → `manga-storage`
- `/api/health` để kiểm tra kết nối

## Cloudflare runtime variables
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`

Không commit secret/service-role key vào GitHub.
