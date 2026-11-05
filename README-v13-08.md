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
