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


## v11.2

### Lịch sử đọc
- Sửa cơ chế ghi lịch sử: khi tài khoản đã đăng nhập mở một chapter mà tài khoản có quyền đọc, web sẽ cập nhật `reading_history` ngay.
- Không còn phụ thuộc vào việc chapter phải có ảnh/canvas mới ghi lịch sử.
- Trang chủ tiếp tục chỉ hiện mục **Lịch sử đọc gần đây** khi tài khoản có lịch sử.

### Chặn copy toàn web
- Chặn chọn/copy/cut/right-click/drag văn bản trên phần nội dung công khai.
- Chặn Ctrl/Cmd + C, X, A, S, U ngoài các ô nhập liệu.
- Không chặn input/textarea/select/contenteditable và Rich Text Editor trong Admin.

### Trang Mật khẩu
- Thêm menu **Mật khẩu** trên header.
- URL: `/password`
- Thêm đầy đủ lưu ý và gợi ý mật khẩu theo nội dung đã yêu cầu.

### SQL
- Không có SQL mới cho v11.2.
- Nếu đã chạy `supabase-v11-site-settings.sql` ở v11 thì không cần chạy lại.


## v11.3 — Link preview
- Open Graph + Twitter Card.
- Chapter: Tên truyện - Chapter X | Crescent Moon Translation.
- Trang truyện: Tên truyện | Crescent Moon Translation.
- Preview dùng ảnh bìa nếu có.
- Không cần SQL mới.


## v11.4
- Cải thiện social link preview cho trang chủ, trang truyện và chapter.
- Trang chủ mặc định dùng logo Crescent Moon làm ảnh preview.
- Bổ sung canonical, og:image:secure_url, og:image:type, og:image:width/height, Twitter Card.
- Trang truyện/chapter dùng og:type=article.
- Đổi `.series-info-row b` từ font-weight 800 xuống 700.
- Không cần SQL mới.


## v11.5 — Social preview reliability fix
- Rebuilt the `<head>` block so Open Graph tags are always server-rendered near the top of raw HTML.
- Always outputs `og:title`, `og:description`, `og:url`, `og:type`, `og:site_name`, `og:locale`, and an absolute `og:image`.
- Adds `itemprop` fallback metadata.
- Uses the static Crescent Moon logo for social preview image to avoid crawler issues with the dynamic `/api/cover/...` endpoint.
- Keeps dynamic story/chapter titles:
  - Story: `Tên truyện | Crescent Moon Translation`
  - Chapter: `Tên truyện - Chapter X | Crescent Moon Translation`
- Keeps `.series-info-row b` at font-weight 700.
- Adds `public/robots.txt` with `Allow: /`.
- No SQL required.


## v11.6 — Social preview compatibility
- Adds `public/social-preview.png` at the standard 1200×630 Open Graph size.
- Uses this static public image for home, story and chapter previews for maximum crawler compatibility.
- Adds explicit `og:image:type`, `og:image:width`, `og:image:height`, `twitter:image:alt`.
- Adds `robots: index,follow,max-image-preview:large`.
- `robots.txt` explicitly allows common social preview crawlers.
- Dynamic titles remain:
  - Story: `Tên truyện | Crescent Moon Translation`
  - Chapter: `Tên truyện - Chapter X | Crescent Moon Translation`
- Keeps the series info bold text at font-weight 700.
- No SQL required.


## v11.7 — Preview bằng ảnh bìa truyện
- Trang truyện và chapter dùng chính ảnh bìa của bộ truyện làm `og:image`.
- Thêm endpoint công khai `/api/og-cover/[id]` chỉ để social crawler đọc cover từ R2.
- Endpoint có cache dài, CORS public và không làm lộ ảnh chapter.
- Nếu truyện chưa có cover, tự fallback về `social-preview.png`.
- Trang chủ vẫn dùng ảnh social 1200×630.
- Không cần SQL mới.


## v11.8 — Admin section menu
- Adds a sticky admin navigation menu for:
  - Quảng cáo
  - Thêm truyện
  - Quản lý truyện
- Clicking a menu item scrolls directly to that section.
- Uses anchor IDs, so future admin tasks can be added as another menu item/section.
- Renames “Truyện hiện có” to “Quản lý truyện”.
- Responsive 3-button layout on mobile.
- No SQL required.


## v11.9 — Admin sidebar
- Moves the admin section menu into a vertical left sidebar on desktop.
- Sidebar stays visible while scrolling.
- Main admin tools remain in the right content column.
- On mobile, the menu automatically returns to a compact horizontal 3-button layout.
- Future admin sections can be added as new sidebar items.
- No SQL required.


## v11.9-fixed
- Fixes Astro build error on `/admin`: mismatched closing `section` / `div`.
- Keeps the left admin sidebar from v11.9.
- Separates the Admin login/status card from the sidebar dashboard.
- Ads and Add Story sections retain card styling.
- No SQL required.


## v11.10 — Thanh điều hướng chapter khi đọc
- Thêm thanh điều hướng cố định ở đáy màn hình khi đang đọc chapter.
- Gồm: nút về trang truyện, Chapter trước, chapter hiện tại, Chapter sau.
- Bấm vào chapter hiện tại để mở danh sách và nhảy nhanh sang chapter khác.
- Tự vô hiệu hóa nút Trước/Sau khi không còn chapter tương ứng.
- Responsive cho điện thoại, có hỗ trợ safe-area trên iPhone.
- Không thêm nút được khoanh đỏ trong ảnh tham khảo.
- Không cần SQL mới.


## v11.11 — Novel chapter editor
- Series with type `Novel` now use a rich-text chapter editor instead of image upload.
- Editor supports bold, italic, underline, heading, paragraph, list, left/center/right alignment, line breaks, separators and remove formatting.
- Paste from Word/Google Docs is supported; content is sanitized server-side.
- Novel chapter text is stored in `chapters.content_html` (max 500,000 chars per chapter).
- Manga/Manhwa/Manhua/Other keep the existing multi-image R2 upload flow.
- Existing Novel chapters can be edited in-place from Admin.
- Admin Preview and public reader render Novel text.
- Reader view statistics/history also work for Novel chapters.
- Duplicate copies Novel text as a Draft.
- Run `supabase-v11-11-novel-content.sql` once.


## v11.12
- Reader: Home SVG icon + separate story Info button.
- Home goes to `/`; Info goes to current series page.
- Removes `trên trình duyệt hiện tại` from password hint.
- No SQL required.


## v11.13
- Reader navigation order changed to: Home → Previous → Current chapter → Next → Info.
- No SQL required.


## v11.14
- Reader navigation wording unified to `Chapter`.
- `Danh sách chap` is now `Danh sách chapter`.
- Adds show/hide eye buttons to all password inputs across the site.
- Passwords stay hidden by default.
- No SQL required.


## v11.15 — Members, comments & chapter notifications
- Admin sidebar adds **Thành viên**.
- Admin can set Member/Admin role, enable/disable accounts, and enable/disable comment permission.
- Disabled accounts are rejected by the website session layer.
- Adds comments to each series page.
- Anyone can read comments; only logged-in active members/admins with comment permission can post.
- Comment owners and admins can delete comments.
- Comments are plain text, max 2,000 characters, with a 15-second posting cooldown.
- Adds a bottom-right/corner toast for newly published chapters (last 7 days).
- Notification is shown once per chapter per browser and links directly to the new chapter.
- Notification checks are throttled to once per 5 minutes per browser.
- Run `supabase-v11-15-members-comments.sql` once before deployment.


## v11.16 — Rich comments
- Comment box now has basic formatting: bold, italic, underline, strikethrough, uppercase selected text, unordered/ordered lists, quote, code and clear formatting.
- Server-side comment sanitizer strips unsafe HTML/scripts and links.
- Existing plain-text comments still render correctly.
- Adds a visible “Lưu ý khi bình luận” panel below the editor.
- No new SQL in this version; the ZIP contains no SQL files.


## v11.17 — Mua raw ủng hộ tác giả
- Adds `Link mua raw` to Add Story and Edit Story in Admin.
- Only `http://` and `https://` links are accepted.
- Series detail page shows `🛒 Mua raw: Ủng hộ tác giả ↗` when a raw link is present.
- The purchase link opens in a new tab and is marked `nofollow sponsored`.
- Removes the visible “2.000 ký tự / 15 giây” line from the comment rules; technical anti-spam limits remain unchanged.
- Run `supabase-v11-17-raw-link.sql` once.
- The ZIP contains only this new SQL migration.


## v11.18 — Header notification center & mobile menu
- Replaces the old corner chapter toast with a bell notification center in the website header.
- Bell badge shows the number of unread chapter updates.
- Clicking the bell opens a scrollable notification panel with cover, story name, chapter, relative time, read/unread state, and direct chapter link.
- Includes “Đánh dấu tất cả đã đọc”; read state is stored per browser with localStorage.
- No All/Chapter/System category tabs.
- On mobile, the regular navigation links collapse into a compact hamburger menu.
- Mobile header keeps only logo + bell + menu button for a cleaner layout.
- Notification API now returns up to 20 recent chapters and their cover images.
- No SQL changes; ZIP contains no SQL files.
