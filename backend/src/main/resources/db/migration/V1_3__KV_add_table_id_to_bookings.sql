-- ====================================================================
-- MIGRATION: Bổ sung table_id cho module Đặt chỗ (Khánh Vân hỗ trợ PER_TABLE)
-- ====================================================================

-- 1. Bổ sung cột table_id vào bảng bookings
ALTER TABLE bookings
ADD COLUMN table_id BIGINT NULL AFTER selected_seats;

-- 2. Thêm khóa ngoại trỏ tới space_tables(id)
ALTER TABLE bookings
ADD CONSTRAINT fk_booking_table
FOREIGN KEY (table_id) REFERENCES space_tables(id) ON DELETE SET NULL;

-- 3. Tạo index hỗ trợ tra cứu xung đột đặt bàn
CREATE INDEX idx_booking_table_time ON bookings (table_id, status, start_time, end_time);
