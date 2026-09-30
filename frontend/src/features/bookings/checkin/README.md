# Check-in API integration + M09 verification

Feature này chỉ sử dụng API thật. Backend là nơi quyết định cuối cùng về quyền, trạng thái booking và cửa sổ check-in.

## Adapter API thật

`services/checkInApiService.ts` gọi các endpoint hiện có:

- Student: `GET /api/bookings/my-bookings`
- Chi tiết booking: `GET /api/bookings/{id}`
- Check-in Student/Staff/Admin: `POST /api/bookings/{id}/check-in`

Hook nhận service bắt buộc qua tham số thứ hai; màn hình tích hợp dùng `useCheckIn(actor, checkInApiService)`. Adapter không gửi actor, role hoặc studentId; JWT trong HTTP client và backend quyết định người thao tác.

Staff chưa có endpoint danh sách tra cứu booking phù hợp. Adapter đã có `getBooking(id)` để nối vào màn hình vận hành khi Tuyến bàn giao luồng tìm booking.

Backend vẫn là nơi quyết định cuối cùng về quyền, trạng thái booking và cửa sổ check-in. Type trong `types/checkIn.ts` là contract tạm của Frontend; cần đối chiếu với DTO chính thức trước khi tích hợp.

## M09 — QR/mã một lần

Luồng thật có thêm hai endpoint:

- `POST /api/bookings/{id}/check-in-token`: tạo mã ngẫu nhiên chỉ trong cửa sổ check-in. Backend chỉ lưu SHA-256 hash và trả mã thô đúng lúc phát hành.
- `POST /api/bookings/{id}/check-in/verify` với `{ "token": "..." }`: kiểm tra đúng booking, hạn dùng, trạng thái và quyền; mã hợp lệ được đánh dấu `USED` rồi gọi lại command check-in chung.

Trong tab Timeline của Staff, nút `Nhập mã QR` mở luồng verify cho từng booking `CONFIRMED`. Input nhận dữ liệu từ máy quét QR kiểu bàn phím; mã hết hạn, sai hoặc đã dùng trả `CHECKIN_TOKEN_INVALID` (409). Mã không tạo trạng thái booking mới và audit thành công vẫn là `CHECK_IN` như check-in thủ công.
