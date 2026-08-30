# Crescent Reader v5

Có thêm sửa/xóa truyện, quản lý chapter, upload nhiều ảnh chapter vào private R2, Public/Password/Member, sửa/xóa chapter, và reader hiển thị ảnh cho chapter Public.

## Trước khi dùng
Chạy `supabase-v5-chapter-policies.sql` một lần trong Supabase SQL Editor.

## Cloudflare
Giữ `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` và binding `MANGA_STORAGE`. `wrangler.jsonc` đã có `keep_vars: true`.

## v6 — khóa cả bộ + bảo vệ reader

Trước khi deploy v6, chạy `supabase-v6-series-lock.sql` một lần trong Supabase SQL Editor.

### Thay đổi chính
- Quyền đọc được đặt ở cấp **truyện**: Public / Password / Member.
- Password áp dụng cho toàn bộ chapter; không cần nhập lại khi tạo từng chapter.
- Mật khẩu được lưu bằng bcrypt (`pgcrypto`) trong bảng riêng `series_passwords`, không lộ qua public API.
- Nhập đúng mật khẩu mở cả bộ trong 12 giờ cho reader session hiện tại.
- R2 vẫn private.
- Ảnh chapter dùng URL HMAC hết hạn sau 5 phút, gắn với reader session và chapter.
- Endpoint ảnh kiểm tra same-origin/same-site, referer, token, expiry và có throttle in-memory chống request dồn dập.
- Reader v6 render ảnh lên `<canvas>` thay vì `<img>`, vì vậy các extension chỉ quét thẻ ảnh thông thường như Imageye sẽ khó thu thập ảnh hơn.
- Không có cơ chế web nào ngăn screenshot/DevTools/extension có quyền sâu 100%; v6 tập trung làm cào tự động và lấy URL hàng loạt khó hơn.

V6 dùng KV binding `SESSION` đã có sẵn để lưu khóa ký HMAC và trạng thái unlock tạm thời.


## v7 – Account System + 30-day login

- Admin và Member đều giữ đăng nhập tối đa 30 ngày.
- Supabase access token tự refresh bằng refresh token; refresh không kéo dài quá deadline 30 ngày ban đầu.
- Đăng ký / đăng nhập / đăng xuất cho Member.
- Tài khoản mới luôn có role `member`; không thể tự đổi role qua profile API.
- Trang `/account`: tên hiển thị, username, avatar, đổi mật khẩu.
- Avatar lưu private trong R2, JPG/PNG/WebP tối đa 2 MB.
- Truyện `member` đọc được sau khi đăng nhập.
- Chạy `supabase-v7-accounts.sql` một lần trước khi deploy v7.
- Sau khi deploy v7, phiên admin v6 cũ không có refresh token nên có thể phải đăng nhập lại đúng 1 lần.

## v8
- Bookmark truyện cho tài khoản đăng nhập.
- Reading history: nhớ chapter gần nhất của từng bộ và nút “Đọc tiếp”.
- Đánh dấu chapter đã đọc/chưa đọc.
- Trang tài khoản có danh sách bookmark và lịch sử đọc gần đây.
- Trang truyện bổ sung thể loại, tác giả, họa sĩ, trạng thái, mô tả, số chapter, chapter mới nhất, ngày cập nhật và nút bookmark.
- Admin thêm/sửa thể loại bằng danh sách ngăn cách bởi dấu phẩy.
- Chạy `supabase-v8-library.sql` một lần trước khi deploy source v8.
