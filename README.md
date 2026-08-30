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

## v9 — Trang chủ, tìm kiếm, lịch đăng & quản lý Admin

Chạy `supabase-v9-discovery-scheduling-admin.sql` trong Supabase SQL Editor trước khi deploy source v9.

### Trang chủ / tìm kiếm
- Trang chủ có Mới cập nhật, Mới đăng, nhóm Manga/Manhwa/Manhua và Novel riêng.
- `/search` tìm theo tên/tác giả và lọc theo loại, trạng thái, thể loại.
- Mới cập nhật dựa trên chapter public thực tế, nên chapter hẹn giờ chỉ được tính khi đã tới giờ.

### Lịch đăng chapter
- Khi upload có 3 chế độ: Publish ngay / Lên lịch / Draft.
- Lên lịch dùng giờ trên trình duyệt admin và chuyển sang ISO trước khi gửi server.
- Chapter hẹn giờ không xuất hiện trong reader/danh sách public trước giờ.
- Đúng giờ, query public tự cho chapter xuất hiện; không cần cron.

### Admin
- Chọn nhiều chapter để Publish / Draft / Xóa hàng loạt.
- Kéo thả chapter và bấm “Lưu thứ tự kéo thả”.
- Duplicate chapter: copy metadata + toàn bộ ảnh R2, chapter copy mặc định là Draft.
- Preview được Draft và chapter đã lên lịch bằng route admin riêng.
- Thống kê số chapter và lượt đọc theo truyện/chapter.
- Lượt đọc được chống đếm refresh liên tục bằng KV: cùng reader + chapter chỉ tính lại sau khoảng 3 phút.

### Lưu ý
- V9 tiếp tục dùng upload nhiều file ảnh cho chapter như v8; không dùng bản ZIP-upload v5.1.
- V9 giả định SQL v6/v7/v8 trước đó đã được chạy.


## UI card refresh
- Ảnh bìa ở card trang chủ/tìm kiếm tràn sát viền, không còn khoảng đệm màu hồng.
- Card giữ bo tròn toàn bộ khung.
- Truyện có status `completed` tự hiện nhãn `FULL` trên góc trái ảnh bìa.


## v9 Card UI - status badges

Card truyện trên trang chủ và trang tìm kiếm tự hiện nhãn theo trạng thái:
- FULL: xanh lá — Hoàn thành
- ONGOING: cam — Đang tiến hành
- HIATUS: xanh dương — Tạm ngưng
- DROP: đỏ — Đã drop

Ảnh bìa vẫn tràn sát card và toàn bộ card giữ bo góc.
Không cần chạy SQL mới cho thay đổi giao diện này.


## Detail cover update

Trang chi tiết truyện:
- Ảnh bìa desktop tăng lên 260px.
- Bỏ padding màu hồng quanh ảnh.
- Ảnh tràn sát toàn bộ khung.
- Bo góc trực tiếp trên ảnh bìa.
- Tablet/mobile tự thu nhỏ tương ứng.
- Không thay đổi card truyện ở trang chủ/tìm kiếm.


## Homepage cleanup
- Đã bỏ khối “Thư viện truyện” + ô tìm kiếm khỏi trang chủ.
- Menu “Tìm kiếm” và trang `/search` vẫn giữ nguyên.


## v10 — Giới thiệu + trình soạn thảo

- Chuyển mô tả truyện khỏi khu vực cạnh ảnh bìa.
- Tạo section riêng **Giới thiệu** phía dưới thông tin truyện và trước danh sách chapter.
- Admin có trình soạn thảo cho Giới thiệu:
  - In đậm
  - In nghiêng
  - Gạch chân
  - Tiêu đề
  - Đoạn văn
  - Danh sách
  - Xuống dòng
  - Đường ngăn cách
  - Xóa định dạng
- Nội dung được sanitize ở server; không cho chèn script/iframe/HTML tùy ý.
- Mô tả cũ dạng text vẫn hiển thị đúng xuống dòng.
- Không cần chạy SQL mới: tiếp tục dùng cột `series.description`.
- Giới hạn phần Giới thiệu: 20.000 ký tự.
- Giữ các chỉnh sửa v9 trước: logo, footer, card/status label, detail cover full-bleed, bỏ khối Thư viện truyện.
- Bỏ mục **Mới đăng** khỏi trang chủ.
- Tên tab mặc định: Crescent Moon Translation.
- Favicon: `/honeymoon_4213586.png`.


## v11

### Trang chi tiết truyện
- Mobile: ảnh bìa nằm trên, căn giữa, rộng tối đa khoảng 220–230px.
- Giữ nguyên tỷ lệ bìa 3:4.
- Thông tin truyện chuyển xuống dưới ảnh trên mobile.
- Desktop vẫn là bìa trái + thông tin phải.
- Phần thông tin dùng cùng một thiết kế trên desktop/mobile:
  icon hồng + từng dòng riêng + đường phân cách.
- Nút Bookmark và Bắt đầu đọc/Đọc tiếp cân đều 2 cột.

### Trang chủ
- Thêm **Lịch sử đọc gần đây** cho tài khoản đã đăng nhập.
- Chỉ hiện khi có lịch sử.
- Nhấn card sẽ đi thẳng tới chapter đang đọc.

### Quảng cáo
- Admin có mục **Quảng cáo**.
- Chỉ có một ô **HTML / Script quảng cáo** + nút lưu.
- Mã được chèn ở trang đọc chapter.
- Để trống và lưu để tắt.
- Cần chạy file `supabase-v11-site-settings.sql` một lần.

### Giữ nguyên từ v10
- Section Giới thiệu riêng.
- Rich text editor.
- Mới cập nhật / Manga / Novel.
- Bỏ Mới đăng.
- Logo, favicon, footer, status badge.
- View cooldown 3 phút.


### v11 layout revision
- Desktop: thông tin truyện chia thành 2 cột.
- Mobile: giữ bố cục ảnh bìa trên, thông tin một cột bên dưới.
- Bookmark và Bắt đầu đọc/Đọc tiếp trở lại dạng nút ngắn theo nội dung trên cả desktop và mobile.
