-- ==============================================================================
-- EDUSPACE - MIGRATION V1_7: THÊM CỘT MÃ BOOKING (BOOKING_CODE)
-- Phân hệ: Quản lý Đặt chỗ Lõi (Module M04 - Nguyễn Thị Khánh Vân)
-- Bảng: bookings
-- ==============================================================================

-- 1. Thêm cột booking_code (cho phép NULL để tương thích dữ liệu hiện có)
ALTER TABLE bookings ADD COLUMN booking_code VARCHAR(30) NULL AFTER id;

-- 2. Cập nhật mã booking chuẩn hóa ngắn gọn cho các đơn hiện có:
-- Định dạng: BK-YYMMDD-{id:04d} (Ví dụ: BK-260918-0001)
UPDATE bookings 
SET booking_code = CONCAT(
    'BK-', 
    DATE_FORMAT(COALESCE(created_at, NOW()), '%y%m%d'), 
    '-', 
    LPAD(id, 4, '0')
)
WHERE booking_code IS NULL;

-- 3. Tạo ràng buộc UNIQUE cho mã booking
ALTER TABLE bookings ADD CONSTRAINT uq_bookings_booking_code UNIQUE (booking_code);
