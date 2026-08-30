# Crescent Reader v3

Astro + Cloudflare Workers + Supabase + private R2.

## v3
- `/login`: đăng nhập bằng Supabase Auth.
- `/admin`: chỉ tài khoản có `profiles.role = 'admin'`.
- Session access token được giữ trong HttpOnly cookie.
- `/api/auth/logout`: đăng xuất.
- `/api/health`: kiểm tra Supabase + R2.

Cloudflare runtime cần:
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- R2 binding `MANGA_STORAGE`
