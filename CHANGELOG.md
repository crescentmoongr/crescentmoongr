# CHANGELOG — Crescent Reader

Lịch sử cập nhật được lưu nguyên văn từ các README phiên bản cũ.

---

## README-v12-83

v12.83 — Account favorites

Adds a compact favorites section below achievements in /account, using the same small cover card layout as bookmarks, sorted newest first with Show more after 12.

Run supabase-v12-83-account-favorites.sql in Supabase SQL Editor before deploying. The SQL looks for an existing favorites table under common names; if the current toggle_series_favorite function uses another table or schema, adjust it before deployment. Existing favorite records are not modified.

---

## README-v12-86

# Crescent Reader v12.86 — Reader protection notice

- Hiển thị hộp cảnh báo giữa màn hình trong 3 giây khi nhấn chuột phải hoặc Ctrl+S/Ctrl+P/F12/Ctrl+Shift+I/J/C/U trên trang đọc chapter.
- Chặn kéo ảnh, sao chép trong vùng nội dung đọc; không can thiệp các trang khác.
- Không thay đổi API, R2, Supabase hay thời gian xóa Canvas. Không cần SQL.
- Lưu ý: extension có thể vượt qua JavaScript; cảnh báo không phải lớp bảo vệ tuyệt đối.

---

## README-v12-92

# Crescent Reader v12.92

- Raw purchase links: selectable CMOA / RENTA / LEZHIN / TAPPYTOON, multiple rows, 20/80 layout.
- Related works: selectable existing titles in Admin, reorder with arrow buttons; compact numbered links after introduction and before chapters.
- IMPORTANT: Run `supabase-v12-92-series-links.sql` in Supabase SQL Editor **before** deploying code.
- Existing CMOA/RENTA URLs are preserved and displayed through fallback; editing and saving migrates them into the new list.
- Update Only ZIP contains changed files at their original repository paths.

---

## README-v12-93

# Crescent Reader v12.93 — NEW badge (48h)

- Homepage > Mới cập nhật: hiển thị ribbon NEW ở góc trên bên phải bìa khi có chapter công khai mới đăng trong vòng 48 giờ (dựa trên `published_at`, fallback `created_at`).
- Áp dụng cả 32 truyện ban đầu và danh sách tải thêm.
- Giữ nguyên badge trạng thái góc trái.
- Không cần SQL mới.
- Update Only: thay `src/pages/index.astro`, `src/styles/global.css` và thêm `public/chapter-new.png`.

---

## README-v12-94

# Crescent Reader v12.94 — NEW bên cạnh chapter

- Bỏ tag NEW trên góc phải ảnh bìa trong mục Mới cập nhật.
- Số chapter font-weight 600; tag NEW màu đỏ với hiệu ứng ánh sáng lấp lánh.
- Tag NEW thay thế trạng thái trong 48 giờ sau khi chapter công khai, sau đó trở lại trạng thái.
- Áp dụng cả các truyện được tải thêm.
- Không cần SQL.
- Nếu còn `public/chapter-new.png` trên GitHub, có thể xóa vì không còn được dùng.
- Chưa kiểm thử build Astro.

---

## README-v12-95

Crescent Reader v12.95: NEW trong 48 giờ có GIF ngôi sao hai đầu: ★ Chap N - NEW ★. Chỉ sửa giao diện Mới cập nhật. Không cần SQL.

---

## README-v12-96

# v12.96
- Ảnh bìa trang chi tiết rộng hơn 20px trên desktop (270 → 290px), tăng khoảng cách phần thông tin 36 → 40px.
- Tên khác hiển thị in nghiêng ngay dưới tên truyện, ngoài danh sách thông tin; có thể chỉnh ở Admin Thêm/Sửa truyện.
- Chạy supabase-v12-96-alternative-title.sql trước khi deploy.
- Không ảnh hưởng dữ liệu cũ.

---

## README-v12-97

# v12.97 — Tên khác

Ẩn nút emoji tự động cạnh ô Tên khác ở Admin. Không thay đổi các ô khác. Không cần SQL mới.

---

## README-v12-98

# Crescent Reader v12.98

- Ảnh bìa trang chi tiết truyện: desktop rộng 375px, cao 500px (tỷ lệ 3:4).
- Dịch phần thông tin sang phải tương ứng; giữ responsive trên màn hình nhỏ.
- Không thay đổi dữ liệu và không cần SQL mới.
- GitHub update-only: thay `src/styles/global.css`.

---

## README-v12-99

# Crescent Reader v12.99

- Adjust desktop series detail cover to 270 × 360 px (3:4), aligned more closely with the adjacent information column.
- Mobile sizing unchanged.
- No SQL changes.
- Update Only: replace `src/styles/global.css` in GitHub.

---

## README-v13-00

# Crescent Reader v13.00

Trang chi tiết truyện: ảnh bìa trên desktop 300 × 450px (tỷ lệ 2:3), cột thông tin tự nhường chỗ. Mobile giữ nguyên.

Update Only: thay `src/styles/global.css` trên GitHub. Không cần SQL. Chưa chạy build Astro.

---

## README-v13-04

# Crescent Reader v13.04 — Comment likes

1. Run `supabase-v13-04-comment-likes.sql` in Supabase SQL Editor first.
2. Update four source files plus SQL: `src/pages/manga/[slug].astro`, `src/lib/supabase.ts`, `src/pages/api/comments/like.ts`, `src/styles/global.css`.
3. Signed-in users can like/unlike comments. Guests can see counts and will be redirected to login.
4. Applies to main comments and replies; keeps the v13.03 reply icon.
5. Build and live deployment not tested.

---

## README-v13-05

# Crescent Reader v13.05 — Thông báo thả tim bình luận

1. Chạy `supabase-v13-05-comment-like-notifications.sql` trong Supabase SQL Editor sau khi đã chạy SQL v13.04.
2. Cập nhật 3 file source: `src/pages/api/notifications/latest.ts`, `src/pages/api/notifications/read.ts`, `src/layouts/BaseLayout.astro`.
3. Chủ bình luận nhận thông báo trong chuông khi người khác thả tim, có liên kết đến bình luận.
4. Không gửi email; không thông báo khi tự thả tim hoặc bỏ tim.
5. Bỏ tim rồi thả lại sẽ làm mới thông báo cũ thay vì nhân đôi.
6. Chưa chạy build Astro hoặc kiểm thử trên Supabase thật.

---

## README-v13-06

# v13.06 — Bỏ thời hạn 5 phút của URL ảnh chapter

Dựa trên v13.05 (không bao gồm tính năng tự tải lại trang đã hủy).

- URL ảnh mới có `e=0` và không hết hạn theo thời gian.
- Vẫn ký HMAC gắn với phiên đọc và kiểm tra chữ ký ở endpoint ảnh.
- URL cũ có thời hạn vẫn được kiểm tra theo quy tắc cũ.
- Không thay đổi giới hạn request, quyền đọc chapter hay cache ảnh.
- Không cần SQL.

Lưu ý: URL ảnh không hết hạn làm giảm khả năng chống chia sẻ link nếu kẻ khác có được cả cookie phiên. Chữ ký vẫn gắn với cookie phiên và cookie có vòng đời riêng. Thay đổi này không đảm bảo khắc phục lỗi ảnh trắng lúc mở chapter; nên kiểm tra Worker logs nếu vẫn lỗi.

---

## README-v13-07

# Crescent Reader v13.07 — Không hết hạn URL ảnh + tự cập nhật trang

Nền tảng: v13.06 No Image URL Expiry (không dùng bản Auto Refresh riêng).

- Giữ nguyên sửa lỗi URL ảnh không hết hạn.
- Tự kiểm tra phiên bản mỗi 5 phút và khi quay lại tab; tải lại một lần nếu có bản mới.
- Không tự tải lại khi đang đọc chapter, ở trang Admin hoặc đang nhập biểu mẫu.
- Không xóa cookie, phiên đăng nhập, bookmark hoặc cache ảnh.
- Không cần SQL mới.
- Khi phát hành bản tiếp theo, cần đổi mã phiên bản trong `src/layouts/BaseLayout.astro` và `src/pages/api/site-version.ts`.
- Chưa chạy build Astro hay kiểm thử Cloudflare thực tế.

---

## README-v13-08

# Crescent Reader v13.08 — Ẩn/hiện truyện hoàn toàn

- Admin → Quản lý truyện: nút Ẩn truyện / Hiện truyện, xác nhận trước khi đổi.
- Ẩn dùng trạng thái `series.is_published=false` có sẵn; không xóa truyện, chapter, bookmark hay dữ liệu.
- Truyện ẩn không xuất hiện trong danh sách, tìm kiếm, trang chi tiết hay trang đọc qua link trực tiếp (404).
- API ảnh chương cũng kiểm tra trạng thái công khai để URL đã cấp không tiếp tục truy cập ảnh sau khi ẩn.
- Admin vẫn thấy truyện và ảnh bìa trong danh sách quản lý, có thể sửa và hiện lại.
- Tăng phiên bản kiểm tra tự cập nhật lên 13.08; giữ cơ chế URL ảnh không hết hạn của v13.07.
- Không cần SQL mới. Trạng thái ẩn sử dụng cột is_published đã tồn tại, cũng là trạng thái bản nháp.
- Lưu ý: ảnh đã tải xuống bộ nhớ trình duyệt trước khi ẩn không thể bị thu hồi từ thiết bị người đọc.
- Chưa chạy build/deploy hoặc thử nghiệm Supabase/Cloudflare thực tế.

---

## README-v13-09

# Crescent Reader v13.09 — Reader limits removed

Base: v13.08.

- Removed in-memory 180 image requests/minute rate limit from `/api/page/[id]`.
- Extended reader session cookie to 400 days (maximum commonly enforced browser cookie lifetime), refreshed on each chapter page visit, including cookies issued with old 48-hour duration. Not literally infinite: browser can clear cookies, session can change, and private browsing may clear on close.
- **Password-protected series unlock cookie remains 48 hours** for security; not the same as reader session.
- Existing signed URL, series visibility and R2 access checks remain.
- No SQL. Not build-tested or deployed.

---

## README-v13-10

# Crescent Reader v13.10 — Tự khôi phục ảnh

- Dựa trên v13.09.
- Tự thử tải từng ảnh tối đa 3 lần; timeout 20 giây mỗi lần, giãn cách ngắn.
- Khi gặp 401/403, thử xin lại URL ảnh bằng API hiện có.
- Khi createImageBitmap lỗi, thử giải mã bằng HTMLImageElement rồi vẽ Canvas.
- Không có nút tải lại ảnh; lỗi cuối cùng được ghi vào Console để chẩn đoán.
- Không cần SQL mới. Chưa chạy build/deploy thực tế.

---

## README-v13-11

# Crescent Reader v13.11 — Mobile Canvas Compatibility

Base: v13.10 Image Recovery.

- Điện thoại / tablet: giải mã bằng `Image()` từ Blob URL, sau đó vẽ lên Canvas.
- Desktop: giữ nguyên logic v13.10 (`createImageBitmap` và fallback cũ).
- Không hiển thị ảnh bằng thẻ `<img>` trong DOM; không chia ảnh dài thành nhiều Canvas.
- Giữ nguyên tự thử tải lại tối đa 3 lần từ v13.10 và các lớp xác thực Worker.
- Không cần SQL.

**Kiểm thử:** Đây là thay đổi mã nguồn; chưa xác nhận hoạt động trên thiết bị thực tế hoặc build/deploy Cloudflare.



## v13.12 — Mobile Canvas Memory Optimization
- Mobile Canvas giới hạn 1600 px rộng, 4096 px cao, tối đa 4 triệu pixel; giữ tỷ lệ và toàn bộ nội dung trong một Canvas.
- Desktop giữ nguyên v13.11. Kiểm tra kích thước, context lost sau khi vẽ.
- Không thay đổi SQL, API hay cơ chế bảo vệ ảnh.
