# Crescent Reader v13.10 — Tự khôi phục ảnh

- Dựa trên v13.09.
- Tự thử tải từng ảnh tối đa 3 lần; timeout 20 giây mỗi lần, giãn cách ngắn.
- Khi gặp 401/403, thử xin lại URL ảnh bằng API hiện có.
- Khi createImageBitmap lỗi, thử giải mã bằng HTMLImageElement rồi vẽ Canvas.
- Không có nút tải lại ảnh; lỗi cuối cùng được ghi vào Console để chẩn đoán.
- Không cần SQL mới. Chưa chạy build/deploy thực tế.
