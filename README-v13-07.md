# Crescent Reader v13.07 — Không hết hạn URL ảnh + tự cập nhật trang

Nền tảng: v13.06 No Image URL Expiry (không dùng bản Auto Refresh riêng).

- Giữ nguyên sửa lỗi URL ảnh không hết hạn.
- Tự kiểm tra phiên bản mỗi 5 phút và khi quay lại tab; tải lại một lần nếu có bản mới.
- Không tự tải lại khi đang đọc chapter, ở trang Admin hoặc đang nhập biểu mẫu.
- Không xóa cookie, phiên đăng nhập, bookmark hoặc cache ảnh.
- Không cần SQL mới.
- Khi phát hành bản tiếp theo, cần đổi mã phiên bản trong `src/layouts/BaseLayout.astro` và `src/pages/api/site-version.ts`.
- Chưa chạy build Astro hay kiểm thử Cloudflare thực tế.
