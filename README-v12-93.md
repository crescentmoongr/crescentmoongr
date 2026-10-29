# Crescent Reader v12.93 — NEW badge (48h)

- Homepage > Mới cập nhật: hiển thị ribbon NEW ở góc trên bên phải bìa khi có chapter công khai mới đăng trong vòng 48 giờ (dựa trên `published_at`, fallback `created_at`).
- Áp dụng cả 32 truyện ban đầu và danh sách tải thêm.
- Giữ nguyên badge trạng thái góc trái.
- Không cần SQL mới.
- Update Only: thay `src/pages/index.astro`, `src/styles/global.css` và thêm `public/chapter-new.png`.
