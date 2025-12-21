# Hướng Dẫn Cấu Hình Ngrok

## Vấn đề: ERR_NGROK_6024

Khi sử dụng ngrok free tier, bạn sẽ gặp trang cảnh báo yêu cầu xác nhận trước khi truy cập. Dự án này đã được cấu hình để tự động bypass cảnh báo này.

## Cách hoạt động

Tất cả các API requests đã được thêm header `ngrok-skip-browser-warning` và `User-Agent` để bypass trang cảnh báo của ngrok.

## Cấu hình Backend URL

1. Tạo file `.env.local` trong thư mục gốc (nếu chưa có):

```bash
NEXT_PUBLIC_API_BASE_URL=https://your-ngrok-url.ngrok-free.dev
```

2. Thay thế `your-ngrok-url.ngrok-free.dev` bằng ngrok URL hiện tại của bạn

3. Restart development server:

```bash
npm run dev
```

## Các file đã được cập nhật

- ✅ `lib/utils.ts` - Thêm helper functions `getNgrokHeaders()` và `fetchWithNgrok()`
- ✅ `hooks/useAuth.ts` - Login/Register requests
- ✅ `hooks/useOrderStats.ts` - Statistics requests
- ✅ `components/dashboard/DashboardView.tsx` - Update order status
- ✅ `components/dashboard/CategoryManagement.tsx` - All category operations
- ✅ `components/dashboard/ProductManagement.tsx` - All product operations
- ✅ `components/dashboard/SingleProductForm.tsx` - Create product

## Tự động áp dụng headers

Tất cả fetch requests đã sử dụng `getNgrokHeaders()` để tự động thêm:

```typescript
{
  'ngrok-skip-browser-warning': 'true',
  'User-Agent': 'MyApp',
  ...otherHeaders
}
```

## Kiểm tra

Sau khi cấu hình, bạn có thể:
1. Chạy `npm run dev`
2. Mở http://localhost:3000
3. Thử login hoặc fetch data - sẽ không còn thấy trang cảnh báo ngrok

## Lưu ý

- File `.env.local` đã được thêm vào `.gitignore` - không lo bị commit
- Mỗi lần restart ngrok, bạn cần cập nhật lại URL trong `.env.local`
- Để production, nên upgrade lên ngrok paid plan hoặc sử dụng custom domain
