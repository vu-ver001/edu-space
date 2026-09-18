# Check-in MVP

Feature này có demo mock và adapter gọi Booking API thật. Backend vẫn là nơi quyết định cuối cùng về quyền, trạng thái booking và cửa sổ check-in.

## Chạy thử

Mở route `/checkin-demo` từ trang tổng quan. Trang có hai vai trò:

- `Student`: chỉ thao tác với booking của mình.
- `Staff`: xem toàn bộ booking và mở hộp thoại check-in hỗ trợ.

Các nút điều khiển cho phép tải lại dữ liệu, đặt lại dữ liệu mẫu và mô phỏng lỗi mạng.

## Chế độ mock

Route `/checkin-demo` hiện dùng `services/checkInService.ts` với fixture để kiểm tra giao diện không cần backend.

## Adapter API thật

`services/checkInApiService.ts` gọi các endpoint hiện có:

- Student: `GET /api/bookings/my-bookings`
- Chi tiết booking: `GET /api/bookings/{id}`
- Check-in Student/Staff/Admin: `POST /api/bookings/{id}/check-in`

Hook nhận service qua tham số thứ hai, nên màn hình thật có thể dùng `useCheckIn(actor, checkInApiService)` mà không sao chép component. Adapter không gửi actor, role hoặc studentId; JWT trong HTTP client và backend quyết định người thao tác.

Staff chưa có endpoint danh sách tra cứu booking phù hợp. Adapter đã có `getBooking(id)` để nối vào màn hình vận hành khi Tuyến bàn giao luồng tìm booking.

Mock giữ các hàm sau để phục vụ demo:

- `listBookings()`
- `checkIn(bookingId, actor)`
- `reset()` chỉ còn dùng cho demo và có thể bỏ khi không còn mock.

Backend vẫn là nơi quyết định cuối cùng về quyền, trạng thái booking và cửa sổ check-in. Type trong `types/checkIn.ts` là contract tạm của Frontend; cần đối chiếu với DTO chính thức trước khi tích hợp.
