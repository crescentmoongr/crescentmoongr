# Crescent Reader v11.85

- Removed the NOW / TODAY / THIS MONTH / TOTAL site statistics feature.
- Removed the 60-second online-presence heartbeat and `/api/stats/site` endpoint to avoid unnecessary Workers KV operations.
- Chapter total view counting remains enabled for existing admin/chapter statistics.
- Notification badge behavior from v11.82 remains: 1–20 shows the exact number, 21+ shows `20+`.
- No SQL is required for this update. Existing v11.82 database objects may be left in place; they are no longer used by the removed site-statistics feature.

v11.84 — Move homepage view statistics into footer below social links/copyright. No new SQL required.

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


## v11.19
- Mobile header remains the original single header bar.
- Order on mobile: Logo | Search | Bell | Hamburger.
- Search removed from hamburger dropdown.
- Fixes hidden dropdown CSS conflict caused by global nav styles.
- Hamburger menu is vertical and only appears after tapping the menu button.
- No SQL changes.


## v11.21 — Author & genre management + advanced search
- Admin sidebar adds **Tác giả** and **Thể loại** management.
- Each author has a dedicated `/author/<slug>` page listing that author's series.
- Author records can store an official X/Twitter profile link; author page shows “Theo dõi trên X”.
- Each genre has a dedicated `/genre/<slug>` page listing series containing that genre.
- Series detail author name and genre pills are now clickable taxonomy links.
- Add/Edit Story uses managed author and genre lists instead of free-text taxonomy fields.
- Existing authors/genres are automatically seeded from current series when the SQL migration runs.
- Search page redesigned to match the requested advanced-search layout (without the “Nhà gõ chữ” section): full-width query box + Author / Status / Sort / Genre filters + reset button.
- Run `supabase-v11-21-authors-genres.sql` once before deploy.
- ZIP contains only this new SQL migration.


## v11.22 — X follow button
- Restyles the author X button as a black rounded pill like the provided reference.
- Adds a simple X icon on the left.
- Button text is now `Theo dõi tác giả trên X`.
- No SQL changes; ZIP contains no SQL files.


## v11.23 — Fix search taxonomy permissions + ombré search panel
- Fixes Supabase `permission denied for table genres` on the advanced search page.
- Grants public read access to both `authors` and `genres` while keeping RLS enabled.
- Recreates the public SELECT policies for both taxonomy tables.
- Changes the advanced-search panel background to a soft pink-purple ombré.
- Run `supabase-v11-23-fix-taxonomy-permissions.sql` once.
- ZIP contains only this new SQL migration.


## v11.24 — WordPress-like author workflow
- Add/Edit Story author field is free text again, with datalist suggestions from existing authors.
- Typing a new author automatically creates an Author taxonomy record through the existing `admin_save_author` RPC.
- The new author automatically gets a slug and a dedicated `/author/<slug>` page.
- Existing authors can still be chosen from browser suggestions while typing.
- Author management in Admin remains available for adding/editing the X profile link.
- No SQL changes; ZIP contains no SQL files.


## v11.25 — Author page ombré + 700 font weight
- Author page header now uses the same soft pink-purple ombré direction as Advanced Search.
- Author name heading weight is reduced to 700.
- Author kicker and X follow button also use 700 to avoid overly heavy text.
- This styling should be preserved in future builds.
- No SQL changes; ZIP contains no SQL files.


## v11.26 — Typography correction
- Restores the large author-name heading to its original heavier weight.
- Keeps the pink-purple ombré author header.
- Uses font-weight 700 for smaller labels such as Author, Genre, Status, Sort by and series metadata labels.
- No SQL changes; ZIP contains no SQL files.


## v11.27 — Major heading color + Mục lục
- Major display headings use `#AC87C5`.
- Includes large author name and series title.
- Includes Giới thiệu, Mục lục and Bình luận section headings.
- Renames visible `Danh sách chương` heading to `Mục lục`.
- No SQL changes; ZIP contains no SQL files.


## v11.28 — Homepage colors
- Main site header uses the soft pink-purple ombré background.
- Homepage section headings `Mới cập nhật`, `Manga / Manhwa / Manhua`, and `Novel` use `#AC87C5`.
- Homepage story/card titles use `#AC87C5`.
- Preserves the v11.27 major-heading color rules elsewhere.
- No SQL changes; ZIP contains no SQL files.

## v11.29
- Fixes homepage story title color to #AC87C5 with direct card-title selectors.
- No SQL changes.

## v11.30 — Soft pastel background
- Overall site background uses a very light blurred pink-purple-blue gradient, roughly 50% softer than the preview direction.
- Header is lightly translucent with backdrop blur so the background glow shows through subtly.
- No SQL changes.


## v11.31 — Custom sky background
- Uses the uploaded `pink-sky-background-with-crescent-moon.jpg` as the full-site background.
- Adds a 50% translucent white overlay over the image for readability.
- Header stays lightly translucent with blur.
- Main content panels remain softly translucent so the background is still visible.
- Mobile uses scroll background attachment for Safari compatibility.
- No SQL changes; ZIP contains no SQL files.

## v11.32
- WordPress-like sticky full-height Admin sidebar on desktop.
- Main tools occupy a separate right column.
- Mobile/tablet sidebar becomes a compact horizontal scroll menu.
- No SQL changes.


## v11.34 — Genre bubble picker
- Replaces the old Ctrl/Cmd multi-select box in Add Story with clickable genre bubbles.
- Multiple genres can be selected simply by tapping/clicking each bubble.
- Selected genres use a soft pink-purple gradient and `#AC87C5` accent.
- Edit Story uses the same bubble picker and keeps existing genres preselected.
- Existing series create/update APIs continue receiving repeated `genres` form values, so no backend or SQL change is needed.
- No SQL changes; ZIP contains no SQL files.


## v11.35 — Batch genres + genre bubbles
- Admin > Genres now accepts multiple names separated by commas in one submission.
- Example: `Romance, Comedy, Drama, Slice of Life`.
- Empty values and duplicates in the same submission are removed automatically.
- Existing individual genre Edit/Save/Delete/View controls are preserved.
- Add Story and Edit Story retain the v11.34 clickable multi-select genre bubbles.
- No SQL changes.


## v11.36 — Simplified series information
- Removed `Chapter mới` from the public series information panel.
- Removed `Họa sĩ` from the public series information panel.
- Removed the `Họa sĩ` input from both Add Story and Edit Story in Admin.
- Existing database/API columns are left intact for compatibility; no migration is required.
- No SQL changes.


## v11.37 — Reorder series information
- Moved `Tác giả` to the first position in the public series information block.
- Desktop and mobile both prioritize author first.
- No SQL changes.


## v11.38 — Mobile cover alignment
- Fixed the series-detail cover on phones so the image sits flush against the top of its rounded frame.
- Cover images use `object-fit: cover` with top-centered positioning on mobile.
- Removes visible pink/background padding caused by conflicting responsive cover rules.
- Desktop layout is unchanged.
- No SQL changes.


## v11.39 — Mới cập nhật: 8 bộ
- Xác nhận và giữ cố định phần `Mới cập nhật` trên trang chủ ở tối đa 8 bộ gần nhất.
- Nút `Xem tất cả` vẫn giữ nguyên.
- Không có SQL mới.


## v11.40 — Homepage Manga/Novel limits
- `Mới cập nhật` remains limited to 8 series.
- `Manga / Manhwa / Manhua` now shows up to 12 series on the homepage.
- `Novel` now shows up to 12 series on the homepage.
- No SQL changes.


## v11.41 — Đồng bộ nút trang chủ
- Đổi `Tìm & lọc →` ở mục Manga và Novel thành `Xem tất cả →`.
- Link/logic lọc theo loại truyện vẫn giữ nguyên.
- Chức năng tìm kiếm và lọc vẫn nằm ở trang Tìm kiếm.
- Không có SQL mới.


## v11.42 — Footer social links
- Adds Admin > Mạng xã hội with Facebook, Telegram and Discord URL fields.
- Footer shows only the distinctive app icons, centered above the copyright.
- Empty social fields are hidden automatically.
- Links open in a new tab.
- Social icons are not shown on Admin pages.
- Run `supabase-v11-42-social-links.sql` once to allow public pages to read the social link setting.
- ZIP contains only this new SQL migration.


## v11.43 — Fix site_settings write permission
- Fixes Supabase 403 `permission denied for table site_settings` when saving social links or ad code.
- Grants authenticated users table-level SELECT/INSERT/UPDATE privileges, while RLS still restricts writes to active admins only.
- Public pages can read only `reader_ad_html` and `social_links`.
- Run `supabase-v11-43-fix-site-settings-write.sql` once.
- ZIP contains only this new SQL migration.


## v11.44 — Social icon alignment
- Centers Facebook / Telegram / Discord icons consistently inside their circular buttons.
- Slightly reduces the Facebook icon and nudges it down 1px to correct its visual imbalance.
- No SQL changes.

## v11.45
- Replaced Facebook SVG with a geometrically centered glyph.
- No SQL changes.


## v11.46 — Fix user registration
- Fixes signup error `new row for relation "profiles" violates check constraint "profiles_role_check"`.
- Normalizes profile roles to the website's current `admin` / `member` model.
- New accounts are created as `member`.
- Rebuilds the `on_auth_user_created` trigger and `ensure_my_profile()` fallback to use `member`.
- Run `supabase-v11-46-fix-registration-role.sql` once.
- No application-code change is required in this release.


## v11.47 — Fix comment permissions
- Fixes Supabase 403 `permission denied for table series_comments`.
- Grants the table-level SELECT/INSERT/DELETE privileges required by PostgREST.
- Keeps RLS enabled: only active members/admins with comment permission can post.
- Comment owners and admins can delete; everyone can read.
- Run `supabase-v11-47-fix-comments-permissions.sql` once.
- No application-code changes are required.


## v11.48 — Consolidated member permissions
- Adds one consolidated Supabase migration for member features.
- Covers profile/avatar metadata, bookmarks, reading history, chapter-read marks and comments.
- Users may only read/write their own bookmark/history/read/profile rows.
- Profile updates are restricted to safe columns (`display_name`, `username`, `avatar_key`, `updated_at`) so members cannot promote themselves or change admin-only flags.
- Comment rules from v11.47 are included.
- Avatar image bytes still stay in private R2; this SQL only fixes the `profiles.avatar_key` metadata permissions.
- Run `supabase-v11-48-member-permissions.sql` once.
- No application-code changes are required.


## v11.49 — Fix /account HTTP 500
- Fixes recursive RLS on `profiles` introduced by the consolidated member-permission migration.
- The profile SELECT policy now allows an authenticated user to read only their own row.
- Admin member management continues through the existing admin RPC, so no recursive admin check is needed in the `profiles` SELECT policy.
- Keeps member profile updates limited to safe columns only.
- Run `supabase-v11-49-fix-profile-rls-recursion.sql` once.
- No application-code changes are required.


## v11.50 — Restore Admin + fix /account
- Restores the site owner profile to role `admin`.
- `/account` no longer uses the Admin-only chapter helper for reading history.
- Adds authenticated SELECT grants for public series/chapter data used by the account page.
- Keeps member profile updates restricted to safe columns.
- Run `supabase-v11-50-restore-admin-and-account.sql` once.


## v11.51 — Bookmark covers + homepage reading history
- Account bookmarks now display as smaller cover cards instead of text rows.
- Desktop shows up to 6 bookmark cards per row; responsive layouts use fewer columns.
- Removed the `Đọc tiếp` / reading-history section from the Account page.
- Homepage reading history is kept for logged-in users and limited to the 4 most recently read series.
- No SQL changes.


## v11.52 — Fix homepage reading history
- Fixes a scope bug where `allChapters` was created inside the initial data-loading `try` block but referenced later in the logged-in history block.
- That ReferenceError was swallowed by the existing `catch {}`, so the homepage loaded normally but `Lịch sử đọc gần đây` stayed empty.
- Homepage now correctly builds the 4 most recent reading-history cards for logged-in users.
- No SQL changes.


## v11.53 — Homepage history cover layout
- `Lịch sử đọc gần đây` now uses vertical cover cards like the homepage/bookmark cards.
- Card size is smaller, matching the compact Bookmark grid style.
- Still shows only the 4 most recently read series.
- Each card keeps the current `Đang đọc Chapter ...` line.
- No SQL changes.


## v11.54 — Comment moderation
- Adds Admin > Bình luận.
- Every new comment is `pending` and is not public until an Admin approves it.
- Admin can approve or delete comments from the Admin dashboard.
- Pending comments are sorted first.
- Public comment counts/lists contain approved comments only.
- After posting, members see a notice that the comment is waiting for approval.
- Also includes the saved UI change: Admin names in member management are red/pink with a subtle glow.
- Run `supabase-v11-54-comment-moderation.sql` once before deploying v11.54.
- ZIP contains only this new SQL migration.

## v11.55 — Mobile Admin menu
- Mobile Admin sidebar collapses to a single Menu button by default.
- Tapping opens a compact scrollable menu; choosing an item closes it.
- Desktop sidebar stays unchanged.
- No SQL changes.


## v11.56 — Fix comment submission RLS
- Fixes `new row violates row-level security policy for table "series_comments"`.
- Comment creation now uses the `create_pending_comment` SECURITY DEFINER RPC.
- The RPC validates active/comment-enabled users, enforces a 15-second cooldown, and always saves new comments as `pending`.
- Admin approval flow from v11.54 remains unchanged.
- Run `supabase-v11-56-comment-submit-fix.sql` once before deploying.
- ZIP contains only this new SQL migration.


## v11.57 — Admin comments publish immediately
- Member comments are still saved as `pending` and require Admin approval.
- Admin comments are saved as `approved` and appear immediately.
- Admin comments also record `moderated_at` and `moderated_by` automatically.
- Run `supabase-v11-57-admin-comment-auto-approve.sql` once before deploying.
- ZIP contains only this new SQL migration.


## v11.58 — Redirect old Workers.dev domain
- Permanently redirects `https://read.crescentmoonmanga.workers.dev/*` to `https://crescentmoonmanga.com/*`.
- Uses HTTP 301.
- Preserves the full path and query string.
- The new `crescentmoonmanga.com` domain is not redirected and continues serving the site normally.
- No SQL changes; this ZIP contains no `.sql` files.


## v11.59 — Admin name glow everywhere
- Admin display names use the red/pink glow style across the site.
- Includes public comments, the “Bình luận với tư cách …” line, Admin comment management, header account name, account page, and member management.
- Member names remain unchanged.
- Public/admin comment RPCs now return the comment author's role.
- Run `supabase-v11-59-admin-name-role-in-comments.sql` once before deploying.
- ZIP contains only this new SQL migration.


## v11.60 — Comment avatars
- Public comments now show each user's uploaded avatar.
- Users without an avatar get a circular moon placeholder.
- Avatar images are served from private R2 through `/api/avatar/[id]`.
- The avatar endpoint no longer requires the viewer to own that avatar; it exposes only the rendered image, not the private R2 object key.
- Run `supabase-v11-60-comment-avatars.sql` once before deploying.
- ZIP contains only this new SQL migration.


## v11.61 — Intro editor paste formatting
- Pasting text into the `Giới thiệu` rich-text editor now pastes as plain text.
- Bold/italic/underline styles from Word, websites, Google Docs, etc. are no longer carried over automatically.
- Manual toolbar formatting still works normally after pasting.
- Applied to both Add Series and Edit Series screens.
- No SQL changes; this ZIP contains no `.sql` files.


## v11.62 — Fix sticky bold in Giới thiệu editor
- Fixes the rich editor losing the selected text when a toolbar button is clicked.
- Bold/italic/underline now apply only to the selected text instead of becoming a sticky formatting state at the caret.
- Pasted text is inserted in a neutral state and no longer becomes bold because of a previous formatting state.
- Applied to both Add Series and Edit Series.
- No SQL changes; ZIP contains no `.sql` files.


## v11.63 — Multiple authors separated by commas
- Admin can enter multiple authors in one field separated by commas, e.g. `Kasukabe Akira, Hanabusa Suuji`.
- Each author is automatically created as a separate author taxonomy record with its own slug.
- Duplicate names in the same field are removed case-insensitively.
- Series stores the normalized display string joined with `, `.
- Public series detail renders each author as a separate clickable author link.
- Author archive pages correctly include series where that author is one of several authors.
- Search author filtering also supports multi-author series.
- No SQL changes; ZIP contains no `.sql` files.


## v11.64 — Stronger fix for automatic Bold
- Bold/Italic/Underline buttons now do nothing unless text is actually selected.
- This prevents inline formatting from becoming a sticky typing state.
- After formatting selected text, the caret is collapsed and sticky inline formatting is explicitly neutralized.
- Pasted text is inserted into a neutral wrapper so it cannot inherit Bold from the current caret/container.
- The Bold button no longer looks active simply because it has keyboard/mouse focus.
- Applied to both Add Series and Edit Series.
- No SQL changes; ZIP contains no `.sql` files.


## v11.65 — WordPress-style Giới thiệu editor
- Rebuilt the Giới thiệu field as a WordPress Classic Editor-style interface.
- Adds Trực quan / Văn bản tabs.
- Visual toolbar: paragraph/headings/blockquote, bold, italic, underline, bullet/numbered lists, alignment, horizontal rule, clear formatting.
- Text mode exposes editable HTML like WordPress's Text tab.
- Clipboard HTML formatting is preserved in Visual mode, closer to WordPress behavior.
- The Novel chapter editor remains separate and unchanged.
- Applied to Add Series and Edit Series.
- No SQL changes; ZIP contains no `.sql` files.


## v11.66 — Classic Editor style
- Reworked the Giới thiệu field to visually and functionally resemble WordPress Classic Editor more closely.
- Keeps Trực quan / Văn bản tabs.
- Toolbar now includes paragraph/heading formats, bold, italic, strikethrough, lists, blockquote, alignment, link/unlink, horizontal rule, underline, clear formatting, undo and redo.
- Visual styling now follows WordPress Classic Editor more closely: square editor frame, gray toolbar, compact controls, white editing canvas.
- Text tab remains editable HTML.
- No SQL changes; ZIP contains no `.sql` files.


## v11.67 — Classic Editor for Novel chapters
- Applies the same WordPress Classic Editor-style interface to Novel chapter content.
- Works for both creating a new Novel chapter and editing existing Novel chapters.
- Includes Visual/Text tabs, paragraph/headings, bold/italic/underline/strikethrough, lists, quote, alignment, link/unlink, horizontal rule, clear formatting, undo/redo.
- Novel editor is taller for long-form writing.
- No SQL changes; ZIP contains no `.sql` files.


## v11.68 — Reuse Bình luận editor behavior
- Removed the WordPress-like custom editor implementation from Giới thiệu and Novel content because it was still causing formatting issues.
- Giới thiệu (Add Series + Edit Series) now uses the same toolbar behavior and execCommand flow as the working public Bình luận editor.
- Novel chapter content (Create + Edit) now uses the same editor behavior too.
- Toolbar: Bold, Italic, Underline, Strikethrough, Uppercase, bullet list, numbered list, blockquote, code, clear formatting.
- Existing saved Giới thiệu/Novel HTML is loaded into the editor when editing.
- No SQL changes; ZIP contains no `.sql` files.


## v11.69 — Fix sticky Bold + lost paragraph breaks
- Fixed the root cause of Bold being triggered when clicking/selecting inside admin rich editors: the editor/toolbar was nested inside a HTML <label>, which can activate the first button. Rich editor fields now use neutral <div> wrappers instead.
- Bold/Italic/Underline/Strikethrough are now strictly selection-only and do not use sticky execCommand state.
- Toolbar button focus/active styles can no longer look permanently selected.
- Enter creates paragraphs and Shift+Enter creates a line break.
- Before submit, browser-generated DIV blocks are normalized to P blocks.
- Server sanitizers also convert DIV blocks to P before stripping tags, preventing saved paragraph spacing from disappearing.
- Applies to Add Series Giới thiệu, Edit Series Giới thiệu, Create Novel chapter, and Edit Novel chapter.
- No SQL changes; ZIP contains no `.sql` files.

## v11.70 — Build fix
- Fixed mismatched label/div tags in Admin Novel editor introduced in v11.69.
- Keeps all v11.69 sticky-Bold and paragraph-preservation fixes.
- No SQL changes; ZIP contains no .sql files.


## v11.71 — Fix Enter in admin editors
- Removed the custom keydown/preventDefault handler for Enter and Shift+Enter.
- The browser now handles Enter natively inside contenteditable, which fixes Enter doing nothing on some Chromium/Cloudflare deployments.
- Existing save-time DIV -> P normalization remains, so paragraph breaks are still preserved after saving.
- No SQL changes; ZIP contains no `.sql` files.


## v11.73 — Homepage spacing + ombre bubble buttons
- Built directly from v11.71; v11.72 section-card design was intentionally skipped.
- Increased vertical spacing between Lịch sử đọc gần đây, Mới cập nhật, Manga / Manhwa / Manhua, and Novel.
- Replaced plain text "Xem tất cả" links with pastel ombre bubble buttons.
- Added hover lift, soft shadow, and animated arrow for better visibility.
- Novel link text is standardized to "Xem tất cả".
- No SQL changes; ZIP contains no `.sql` files.


## v11.74 — Threaded comment replies
- Added reply-to-comment support with up to 10 levels total (depth 0–9).
- Replies render nested below their parent comment with a soft vertical guide line.
- Each approved visible comment can be replied to while logged in, until the 10-level limit is reached.
- Reply editor uses the same rich-comment toolbar.
- Admin replies remain approved immediately; member replies continue to enter moderation.
- Deleting a parent comment also deletes replies beneath it.
- Mobile indentation is capped so deep threads remain readable.
- Also carries the saved preference from v11.73: homepage ombre “Xem tất cả” button font-weight reduced from 800 to 600.
- SQL migration REQUIRED: run `supabase-v11-74-threaded-comments.sql` once in Supabase SQL Editor.


## v11.75 — Threaded comments SQL fix
- Fixes the v11.74 SQL error: `profiles` identifies users with column `id`, not `user_id`.
- Corrected both the public comment join (`p.id = c.user_id`) and member profile lookup (`where id = auth.uid()`).
- Keeps all v11.74 threaded-reply code and the 10-level limit.
- Run `supabase-v11-75-threaded-comments-fix.sql` once in Supabase SQL Editor.
- The ZIP contains only this corrected SQL migration; the broken v11.74 SQL file was removed.


## v11.76 — Astro build syntax fix
- Fixes the Cloudflare/Astro parse error in `src/pages/manga/[slug].astro` around the threaded-comment wrapper style attribute.
- Replaced the problematic inline template style binding with Astro-compatible object style binding.
- Keeps all threaded comment/reply logic from v11.75 and the corrected SQL migration.
- No new SQL changes. The ZIP keeps the same `supabase-v11-75-threaded-comments-fix.sql`; if you already ran it successfully, do not run it again.


## v11.77 — Astro threaded-comments build fix
- Removed the frontmatter JSX/Astro renderer function that caused the parser error.
- Threading is now flattened in plain JS and rendered directly in the Astro template.
- Reply depth uses CSS classes instead of inline style bindings.
- Keeps reply support up to 10 levels.
- No new SQL; ZIP contains no `.sql` files.

## v11.78 — Account logout + saved UI fixes
- Moved the logout button from Admin to the Account page for logged-in users, including Admin accounts.
- Removed the logout button from the Admin page.
- Applied the saved comment-form changes: removed “Chỉ thành viên đã đăng nhập mới có thể bình luận.” and aligned “Gửi bình luận” to the right.
- Keeps the thinner homepage “Xem tất cả” bubble text from v11.77.
- No SQL changes; ZIP contains no `.sql` files.

## v11.79 — Moon section icons + pink detail title
- Added the supplied half-moon icon before homepage headings: Lịch sử đọc gần đây, Mới cập nhật, Manga / Manhwa / Manhua, Novel.
- Added it before detail headings: Giới thiệu, Mục lục, Bình luận.
- Added spacing between icon and heading text.
- Changed the series title on the detail page to the same pink family as the “Ủng hộ tác giả” accent.
- Keeps the saved comment-footer changes from v11.78.
- No SQL; ZIP contains no .sql files.

## v11.80 — Replace chapter images safely
- Added “Thay toàn bộ ảnh chapter” to each non-Novel chapter in Admin > Sửa truyện.
- Uses the same multi-image upload format as Add Chapter (JPG/PNG/WebP/GIF, sorted by filename, max 15 MB each).
- Safe replacement flow: upload every new image to a new R2 revision path first; only then swap `chapter_pages`; only after the swap succeeds are old R2 objects deleted.
- If upload or DB swap fails, the new revision is cleaned up and the old chapter page rows are restored/kept so the existing chapter remains readable.
- Chapter metadata, publish state, stats, history, and chapter ID are unchanged.
- No SQL changes; ZIP contains no `.sql` files.


## v11.81 — Admin subrequest optimization
- Fixes `/admin` blank-page failures caused by Cloudflare `Too many subrequests by single Worker invocation`.
- Previously the admin dashboard loaded chapters and chapter stats separately for every series (`2 × number of series` extra Supabase requests).
- The dashboard now loads all series, all chapter metadata, and all chapter stats in three batched requests, then groups/counts them in memory by `series_id`.
- Admin UI and workflow are unchanged.
- Existing per-series chapter edit pages still use their normal targeted queries.
- No SQL changes; ZIP contains no `.sql` files.

## v11.82
- Homepage compact view statistics: NOW / TODAY / THIS MONTH / TOTAL.
- NOW uses a lightweight 3-minute KV presence heartbeat.
- TODAY / THIS MONTH use daily aggregated view counts in Supabase.
- TOTAL continues to use existing chapter view totals.
- Notification badge shows the real number through 20, then `20+` from 21 unread notifications onward; dropdown still renders only the latest 20.
- Run `supabase-v11-82-site-stats.sql` once before deploying/using the new daily counters.
