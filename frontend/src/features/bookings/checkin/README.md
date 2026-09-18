# Check-in MVP mock

Feature này mô phỏng luồng check-in thủ công trước khi Booking API có thật.

## Chạy thử

Mở route `/checkin-demo` từ trang tổng quan. Trang có hai vai trò:

- `Student`: chỉ thao tác với booking của mình.
- `Staff`: xem toàn bộ booking và mở hộp thoại check-in hỗ trợ.

Các nút điều khiển cho phép tải lại dữ liệu, đặt lại dữ liệu mẫu và mô phỏng lỗi mạng.

## Khi nối API thật

Giữ nguyên component và hook. Thay phần cài đặt trong `services/checkInService.ts` bằng adapter gọi API của Vân, giữ các hàm:

- `listBookings()`
- `checkIn(bookingId, actor)`
- `reset()` chỉ còn dùng cho demo và có thể bỏ khi không còn mock.

Backend vẫn là nơi quyết định cuối cùng về quyền, trạng thái booking và cửa sổ check-in. Type trong `types/checkIn.ts` là contract tạm của Frontend; cần đối chiếu với DTO chính thức trước khi tích hợp.
