# Crescent Reader Starter

Starter web truyện Astro + Cloudflare Workers.

## Có sẵn
- Trang chủ responsive
- Trang chi tiết truyện
- Danh sách chapter
- Reader demo
- Giao diện chapter khóa
- Admin demo

## Chạy local
```bash
npm install
npm run dev
```

## GitHub → Cloudflare
1. Upload toàn bộ source lên một repository GitHub.
2. Cloudflare Dashboard → Workers & Pages → Create application → Import a repository.
3. Kết nối GitHub và chọn repository.
4. Build command: `npm run build`
5. Deploy command: `npx wrangler deploy`
6. Production branch: `main`
7. Save and Deploy.

Mỗi lần push commit mới lên `main`, Cloudflare sẽ tự build/deploy.

## Tiếp theo
Supabase Auth/DB, RLS, R2 private bucket, API kiểm tra quyền chapter, admin upload hàng loạt, bookmark và lịch sử đọc.
