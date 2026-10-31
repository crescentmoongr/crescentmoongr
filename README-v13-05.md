# Crescent Reader v13.05 — Thông báo thả tim bình luận

1. Chạy `supabase-v13-05-comment-like-notifications.sql` trong Supabase SQL Editor sau khi đã chạy SQL v13.04.
2. Cập nhật 3 file source: `src/pages/api/notifications/latest.ts`, `src/pages/api/notifications/read.ts`, `src/layouts/BaseLayout.astro`.
3. Chủ bình luận nhận thông báo trong chuông khi người khác thả tim, có liên kết đến bình luận.
4. Không gửi email; không thông báo khi tự thả tim hoặc bỏ tim.
5. Bỏ tim rồi thả lại sẽ làm mới thông báo cũ thay vì nhân đôi.
6. Chưa chạy build Astro hoặc kiểm thử trên Supabase thật.
