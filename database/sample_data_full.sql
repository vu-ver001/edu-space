-- ============================================================================
-- EduSpace - Dữ liệu mẫu tổng hợp phục vụ demo giao diện và nghiệp vụ
-- Có thể chạy lại: chỉ cập nhật/xóa các bản ghi mang mã DEMO hoặc tiền tố [DEMO].
-- Mật khẩu các tài khoản mẫu: dùng cùng hash với student@eduspace.vn (123456).
-- ============================================================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
-- Container MySQL đang dùng UTC, còn backend chạy theo Asia/Ho_Chi_Minh.
-- Đặt múi giờ cho phiên seed để các mốc NOW() khớp với scheduler của backend.
SET time_zone = '+07:00';
USE eduspace;
START TRANSACTION;

-- --------------------------------------------------------------------------
-- 1. Người dùng mẫu
-- --------------------------------------------------------------------------
SET @demo_password := COALESCE(
    (SELECT password FROM users WHERE email = 'student@eduspace.vn' LIMIT 1),
    '$2a$10$XPrJX/BgkfBcGGHJtDVUmefiCIdNdlHBgAg6h3.DPSQbrW1.tK5S2'
);

INSERT INTO users (email, password, full_name, phone_number, role, is_active) VALUES
('sv.anh@eduspace.vn', @demo_password, 'Nguyễn Minh Anh', '0987654321', 'STUDENT', b'1'),
('sv.nam@eduspace.vn', @demo_password, 'Trần Hoàng Nam', '0987654322', 'STUDENT', b'1'),
('sv.ha@eduspace.vn',  @demo_password, 'Lê Thu Hà',      '0987654323', 'STUDENT', b'1')
ON DUPLICATE KEY UPDATE
    full_name = VALUES(full_name),
    phone_number = VALUES(phone_number),
    role = VALUES(role),
    is_active = b'1';

SET @admin_id := (SELECT id FROM users WHERE email = 'admin@eduspace.vn' LIMIT 1);
SET @staff_id := (SELECT id FROM users WHERE email = 'staff@eduspace.vn' LIMIT 1);
SET @student_anh := (SELECT id FROM users WHERE email = 'sv.anh@eduspace.vn' LIMIT 1);
SET @student_nam := (SELECT id FROM users WHERE email = 'sv.nam@eduspace.vn' LIMIT 1);
SET @student_ha := (SELECT id FROM users WHERE email = 'sv.ha@eduspace.vn' LIMIT 1);

-- --------------------------------------------------------------------------
-- 2. Loại không gian
-- --------------------------------------------------------------------------
INSERT INTO space_types
    (name, description, booking_mode, requires_approval, deleted_at, created_at, updated_at)
VALUES
('Phòng học nhóm nâng cao', 'Phòng kín dành cho nhóm học và họp câu lạc bộ.', 'WHOLE_SPACE', b'1', NULL, NOW(6), NOW(6)),
('Khu tự học yên tĩnh', 'Khu tự học đặt theo từng ghế, ưu tiên không gian yên tĩnh.', 'PER_SEAT', b'0', NULL, NOW(6), NOW(6)),
('Phòng thảo luận linh hoạt', 'Không gian thảo luận đặt theo từng bàn.', 'PER_TABLE', b'1', NULL, NOW(6), NOW(6))
ON DUPLICATE KEY UPDATE
    description = VALUES(description),
    booking_mode = VALUES(booking_mode),
    requires_approval = VALUES(requires_approval),
    deleted_at = NULL,
    updated_at = NOW(6);

SET @type_whole := (SELECT id FROM space_types WHERE name = 'Phòng học nhóm nâng cao' LIMIT 1);
SET @type_seat := (SELECT id FROM space_types WHERE name = 'Khu tự học yên tĩnh' LIMIT 1);
SET @type_table := (SELECT id FROM space_types WHERE name = 'Phòng thảo luận linh hoạt' LIMIT 1);

-- --------------------------------------------------------------------------
-- 3. Tiện ích
-- --------------------------------------------------------------------------
INSERT INTO facilities (name, description, deleted_at, created_at, updated_at) VALUES
('Bảng tương tác', 'Bảng cảm ứng hỗ trợ trình chiếu và ghi chú trực tiếp.', NULL, NOW(6), NOW(6)),
('Camera hội nghị', 'Camera góc rộng phục vụ họp và học trực tuyến.', NULL, NOW(6), NOW(6)),
('Máy tính trình chiếu', 'Máy tính kết nối sẵn với màn hình hoặc máy chiếu.', NULL, NOW(6), NOW(6))
ON DUPLICATE KEY UPDATE
    description = VALUES(description),
    deleted_at = NULL,
    updated_at = NOW(6);

SET @facility_wifi := COALESCE(
    (SELECT id FROM facilities WHERE name IN ('Wi-Fi', 'Wi-Fi High Speed') AND deleted_at IS NULL ORDER BY id LIMIT 1),
    (SELECT id FROM facilities WHERE deleted_at IS NULL ORDER BY id LIMIT 1)
);
SET @facility_board := (SELECT id FROM facilities WHERE name = 'Bảng tương tác' LIMIT 1);
SET @facility_camera := (SELECT id FROM facilities WHERE name = 'Camera hội nghị' LIMIT 1);
SET @facility_pc := (SELECT id FROM facilities WHERE name = 'Máy tính trình chiếu' LIMIT 1);

-- --------------------------------------------------------------------------
-- 4. Không gian
-- --------------------------------------------------------------------------
-- Không phụ thuộc ràng buộc UNIQUE của space_code vì một số CSDL cũ chưa có
-- migration đó. Nhờ vậy chạy file nhiều lần cũng không tạo không gian trùng.
INSERT INTO spaces
    (space_code, name, space_type_id, building, floor, capacity, status, description,
     deleted_at, created_at, updated_at)
SELECT 'DEMO-A101', 'Phòng học nhóm Demo A-101', @type_whole, 'Tòa A', '1', 8, 'AVAILABLE',
       'Phòng học nhóm có bảng tương tác và thiết bị trình chiếu.', NULL, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM spaces WHERE space_code = 'DEMO-A101');

INSERT INTO spaces
    (space_code, name, space_type_id, building, floor, capacity, status, description,
     deleted_at, created_at, updated_at)
SELECT 'DEMO-S201', 'Khu tự học Demo S-201', @type_seat, 'Tòa B', '2', 8, 'AVAILABLE',
       'Khu tự học yên tĩnh gồm tám chỗ ngồi cá nhân.', NULL, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM spaces WHERE space_code = 'DEMO-S201');

INSERT INTO spaces
    (space_code, name, space_type_id, building, floor, capacity, status, description,
     deleted_at, created_at, updated_at)
SELECT 'DEMO-D301', 'Phòng thảo luận Demo D-301', @type_table, 'Tòa D', '3', 16, 'AVAILABLE',
       'Phòng thảo luận gồm bốn bàn, mỗi bàn bốn chỗ.', NULL, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM spaces WHERE space_code = 'DEMO-D301');

UPDATE spaces
SET name = 'Phòng học nhóm Demo A-101', space_type_id = @type_whole,
    building = 'Tòa A', floor = '1', capacity = 8, status = 'AVAILABLE',
    description = 'Phòng học nhóm có bảng tương tác và thiết bị trình chiếu.',
    deleted_at = NULL, updated_at = NOW(6)
WHERE space_code = 'DEMO-A101';

UPDATE spaces
SET name = 'Khu tự học Demo S-201', space_type_id = @type_seat,
    building = 'Tòa B', floor = '2', capacity = 8, status = 'AVAILABLE',
    description = 'Khu tự học yên tĩnh gồm tám chỗ ngồi cá nhân.',
    deleted_at = NULL, updated_at = NOW(6)
WHERE space_code = 'DEMO-S201';

UPDATE spaces
SET name = 'Phòng thảo luận Demo D-301', space_type_id = @type_table,
    building = 'Tòa D', floor = '3', capacity = 16, status = 'AVAILABLE',
    description = 'Phòng thảo luận gồm bốn bàn, mỗi bàn bốn chỗ.',
    deleted_at = NULL, updated_at = NOW(6)
WHERE space_code = 'DEMO-D301';

SET @space_whole := (SELECT MIN(id) FROM spaces WHERE space_code = 'DEMO-A101');
SET @space_seat := (SELECT MIN(id) FROM spaces WHERE space_code = 'DEMO-S201');
SET @space_table := (SELECT MIN(id) FROM spaces WHERE space_code = 'DEMO-D301');

-- --------------------------------------------------------------------------
-- 5. Ghế và bàn
-- --------------------------------------------------------------------------
INSERT INTO seats
    (space_id, seat_code, status, description, deleted_at, created_at, updated_at)
VALUES
(@space_seat, 'S01', 'AVAILABLE', 'Ghế gần cửa sổ', NULL, NOW(6), NOW(6)),
(@space_seat, 'S02', 'AVAILABLE', 'Ghế gần cửa sổ', NULL, NOW(6), NOW(6)),
(@space_seat, 'S03', 'AVAILABLE', 'Ghế khu vực trung tâm', NULL, NOW(6), NOW(6)),
(@space_seat, 'S04', 'AVAILABLE', 'Ghế khu vực trung tâm', NULL, NOW(6), NOW(6)),
(@space_seat, 'S05', 'AVAILABLE', 'Ghế có ổ cắm', NULL, NOW(6), NOW(6)),
(@space_seat, 'S06', 'AVAILABLE', 'Ghế có ổ cắm', NULL, NOW(6), NOW(6)),
(@space_seat, 'S07', 'AVAILABLE', 'Ghế phía cuối phòng', NULL, NOW(6), NOW(6)),
(@space_seat, 'S08', 'INACTIVE',  'Tạm khóa để bảo trì', NULL, NOW(6), NOW(6))
ON DUPLICATE KEY UPDATE
    status = VALUES(status),
    description = VALUES(description),
    deleted_at = NULL,
    updated_at = NOW(6);

INSERT INTO space_tables
    (space_id, table_code, capacity, status, description, deleted_at, created_at, updated_at)
VALUES
(@space_table, 'T01', 4, 'AVAILABLE', 'Bàn thảo luận số 1', NULL, NOW(6), NOW(6)),
(@space_table, 'T02', 4, 'AVAILABLE', 'Bàn thảo luận số 2', NULL, NOW(6), NOW(6)),
(@space_table, 'T03', 4, 'AVAILABLE', 'Bàn thảo luận số 3', NULL, NOW(6), NOW(6)),
(@space_table, 'T04', 4, 'AVAILABLE', 'Bàn thảo luận số 4', NULL, NOW(6), NOW(6))
ON DUPLICATE KEY UPDATE
    capacity = VALUES(capacity),
    status = VALUES(status),
    description = VALUES(description),
    deleted_at = NULL,
    updated_at = NOW(6);

SET @table_01 := (SELECT id FROM space_tables WHERE space_id = @space_table AND table_code = 'T01' LIMIT 1);
SET @table_02 := (SELECT id FROM space_tables WHERE space_id = @space_table AND table_code = 'T02' LIMIT 1);

-- --------------------------------------------------------------------------
-- 6. Liên kết tiện ích
-- --------------------------------------------------------------------------
INSERT IGNORE INTO space_facilities (space_id, facility_id) VALUES
(@space_whole, @facility_wifi),
(@space_whole, @facility_board),
(@space_whole, @facility_pc),
(@space_seat, @facility_wifi),
(@space_table, @facility_wifi),
(@space_table, @facility_camera),
(@space_table, @facility_board);

-- --------------------------------------------------------------------------
-- 7. Chính sách booking mà backend hiện tại đang đọc
-- --------------------------------------------------------------------------
INSERT INTO booking_policies
    (policy_key, policy_value, description, updated_by, updated_at)
VALUES
('DAILY_BOOKING_QUOTA', '2', 'Số booking đang chiếm chỗ tối đa mỗi sinh viên trong ngày.', 'seed@eduspace.local', NOW(6)),
('MAX_DURATION_MINUTES', '180', 'Thời lượng tối đa cho một lượt đặt (phút).', 'seed@eduspace.local', NOW(6)),
('RATE_LIMIT_HOURLY', '10', 'Số yêu cầu tạo booking tối đa mỗi giờ.', 'seed@eduspace.local', NOW(6)),
('CHECKIN_OPEN_MINUTES', '15', 'Cho phép check-in sớm trước giờ bắt đầu (phút).', 'seed@eduspace.local', NOW(6)),
('CHECKIN_GRACE_MINUTES', '15', 'Thời gian cho phép check-in trễ (phút).', 'seed@eduspace.local', NOW(6)),
('OPENING_HOUR', '07:00', 'Giờ mở cửa hệ thống.', 'seed@eduspace.local', NOW(6)),
('CLOSING_HOUR', '22:00', 'Giờ đóng cửa hệ thống.', 'seed@eduspace.local', NOW(6))
ON DUPLICATE KEY UPDATE
    policy_key = VALUES(policy_key);

-- --------------------------------------------------------------------------
-- 8. Lịch học mẫu (chỉ làm mới dữ liệu [DEMO])
-- --------------------------------------------------------------------------
DELETE FROM student_schedules
WHERE student_id IN (@student_anh, @student_nam, @student_ha)
  AND course_name LIKE '[DEMO]%';

INSERT INTO student_schedules
    (student_id, course_name, schedule_date, start_time, end_time, room)
VALUES
(@student_anh, '[DEMO] Phát triển phần mềm dịch vụ', DATE_ADD(CURDATE(), INTERVAL 1 DAY), '08:00:00', '10:00:00', 'P-201'),
(@student_nam, '[DEMO] Kiến trúc phần mềm', DATE_ADD(CURDATE(), INTERVAL 2 DAY), '13:00:00', '15:00:00', 'G-102'),
(@student_ha,  '[DEMO] Kiểm thử phần mềm', DATE_ADD(CURDATE(), INTERVAL 3 DAY), '09:00:00', '11:00:00', 'P-201');

-- --------------------------------------------------------------------------
-- 9. Bảo trì mẫu (chỉ làm mới dữ liệu [DEMO])
-- --------------------------------------------------------------------------
DELETE FROM maintenance_blocks
WHERE space_id IN (@space_whole, @space_seat, @space_table)
  AND reason LIKE '[DEMO]%';

INSERT INTO maintenance_blocks
    (space_id, start_time, end_time, reason, created_by, deleted_at, created_at, updated_at)
VALUES
(@space_whole, DATE_ADD(CURDATE(), INTERVAL 2 DAY) + INTERVAL 18 HOUR,
 DATE_ADD(CURDATE(), INTERVAL 2 DAY) + INTERVAL 20 HOUR,
 '[DEMO] Bảo trì máy chiếu và bảng tương tác', @staff_id, NULL, NOW(6), NOW(6)),
(@space_seat, DATE_ADD(CURDATE(), INTERVAL 3 DAY) + INTERVAL 6 HOUR,
 DATE_ADD(CURDATE(), INTERVAL 3 DAY) + INTERVAL 7 HOUR,
 '[DEMO] Kiểm tra hệ thống điện và ổ cắm', @staff_id, NULL, NOW(6), NOW(6));

-- --------------------------------------------------------------------------
-- 10. Làm mới booking demo để thời gian luôn phù hợp ngày chạy script
-- --------------------------------------------------------------------------
DROP TEMPORARY TABLE IF EXISTS demo_booking_ids;
CREATE TEMPORARY TABLE demo_booking_ids AS
SELECT id FROM bookings WHERE purpose LIKE '[DEMO]%';

DELETE FROM booking_audit_logs
WHERE booking_id IN (SELECT id FROM demo_booking_ids);

DELETE FROM staff_audit_logs
WHERE target_type = 'BOOKING'
  AND target_id IN (SELECT id FROM demo_booking_ids);

DELETE FROM bookings
WHERE id IN (SELECT id FROM demo_booking_ids);

DROP TEMPORARY TABLE demo_booking_ids;

-- Chờ duyệt: phòng nguyên, bắt đầu sau 1 ngày 2 giờ.
INSERT INTO bookings
    (student_id, space_id, start_time, end_time, participant_count, purpose,
     selected_seats, table_id, status, created_at, updated_at)
VALUES
(@student_anh, @space_whole,
 DATE_ADD(DATE_ADD(NOW(), INTERVAL 1 DAY), INTERVAL 2 HOUR),
 DATE_ADD(DATE_ADD(NOW(), INTERVAL 1 DAY), INTERVAL 4 HOUR),
 6, '[DEMO] Học nhóm chuẩn bị thuyết trình', NULL, NULL, 'PENDING_APPROVAL',
 DATE_SUB(NOW(), INTERVAL 15 MINUTE), NOW());
SET @booking_pending := LAST_INSERT_ID();

-- Chờ check-in và đang nằm trong cửa sổ 15 phút: đặt theo ghế.
INSERT INTO bookings
    (student_id, space_id, start_time, end_time, participant_count, purpose,
     selected_seats, table_id, status, created_at, updated_at)
VALUES
(@student_nam, @space_seat, DATE_ADD(NOW(), INTERVAL 10 MINUTE), DATE_ADD(NOW(), INTERVAL 100 MINUTE),
 2, '[DEMO] Ôn thi theo cặp', 'S01,S02', NULL, 'CONFIRMED',
 DATE_SUB(NOW(), INTERVAL 1 HOUR), NOW());
SET @booking_checkin_ready := LAST_INSERT_ID();

-- Đã xác nhận nhưng chưa đến cửa sổ check-in: đặt theo bàn, sau 2 ngày.
INSERT INTO bookings
    (student_id, space_id, start_time, end_time, participant_count, purpose,
     selected_seats, table_id, status, created_at, updated_at)
VALUES
(@student_ha, @space_table,
 DATE_ADD(DATE_ADD(NOW(), INTERVAL 2 DAY), INTERVAL 5 HOUR),
 DATE_ADD(DATE_ADD(NOW(), INTERVAL 2 DAY), INTERVAL 7 HOUR),
 4, '[DEMO] Họp nhóm dự án cuối kỳ', NULL, @table_01, 'CONFIRMED',
 DATE_SUB(NOW(), INTERVAL 2 HOUR), NOW());
SET @booking_confirmed := LAST_INSERT_ID();

-- Staff đã check-in hộ.
INSERT INTO bookings
    (student_id, space_id, start_time, end_time, participant_count, purpose,
     selected_seats, table_id, status, checked_in_at, checked_in_by, created_at, updated_at)
VALUES
(@student_anh, @space_table, DATE_SUB(NOW(), INTERVAL 20 MINUTE), DATE_ADD(NOW(), INTERVAL 70 MINUTE),
 4, '[DEMO] Thảo luận bài tập dịch vụ', NULL, @table_02, 'CHECKED_IN',
 DATE_SUB(NOW(), INTERVAL 15 MINUTE), @staff_id, DATE_SUB(NOW(), INTERVAL 3 HOUR), NOW());
SET @booking_checked_in := LAST_INSERT_ID();

-- Các trạng thái lịch sử.
INSERT INTO bookings
    (student_id, space_id, start_time, end_time, participant_count, purpose,
     selected_seats, table_id, status, checked_in_at, checked_in_by, created_at, updated_at)
VALUES
(@student_nam, @space_whole, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 22 HOUR),
 5, '[DEMO] Seminar đã hoàn thành', NULL, NULL, 'COMPLETED',
 DATE_SUB(NOW(), INTERVAL 24 HOUR), @student_nam, DATE_SUB(NOW(), INTERVAL 2 DAY), NOW());
SET @booking_completed := LAST_INSERT_ID();

INSERT INTO bookings
    (student_id, space_id, start_time, end_time, participant_count, purpose,
     selected_seats, table_id, status, rejected_by, rejected_at, reject_reason, created_at, updated_at)
VALUES
(@student_ha, @space_whole, DATE_ADD(NOW(), INTERVAL 3 DAY),
 DATE_ADD(DATE_ADD(NOW(), INTERVAL 3 DAY), INTERVAL 2 HOUR),
 8, '[DEMO] Tổ chức sự kiện chưa đủ thông tin', NULL, NULL, 'REJECTED',
 @staff_id, DATE_SUB(NOW(), INTERVAL 2 HOUR), 'Chưa cung cấp kế hoạch sử dụng thiết bị.',
 DATE_SUB(NOW(), INTERVAL 4 HOUR), NOW());
SET @booking_rejected := LAST_INSERT_ID();

INSERT INTO bookings
    (student_id, space_id, start_time, end_time, participant_count, purpose,
     selected_seats, table_id, status, created_at, updated_at)
VALUES
(@student_anh, @space_seat, DATE_ADD(NOW(), INTERVAL 4 DAY),
 DATE_ADD(DATE_ADD(NOW(), INTERVAL 4 DAY), INTERVAL 1 HOUR),
 1, '[DEMO] Booking sinh viên đã chủ động hủy', 'S03', NULL, 'CANCELLED',
 DATE_SUB(NOW(), INTERVAL 1 DAY), NOW());
SET @booking_cancelled := LAST_INSERT_ID();

INSERT INTO bookings
    (student_id, space_id, start_time, end_time, participant_count, purpose,
     selected_seats, table_id, status, expired_at, expire_reason, created_at, updated_at)
VALUES
(@student_nam, @space_whole, DATE_SUB(NOW(), INTERVAL 2 DAY),
 DATE_ADD(DATE_SUB(NOW(), INTERVAL 2 DAY), INTERVAL 2 HOUR),
 6, '[DEMO] Yêu cầu đã quá hạn duyệt', NULL, NULL, 'EXPIRED', NOW(),
 'PENDING_APPROVAL_TIMEOUT', DATE_SUB(NOW(), INTERVAL 3 DAY), NOW());
SET @booking_expired := LAST_INSERT_ID();

INSERT INTO bookings
    (student_id, space_id, start_time, end_time, participant_count, purpose,
     selected_seats, table_id, status, created_at, updated_at)
VALUES
(@student_ha, @space_seat, DATE_SUB(NOW(), INTERVAL 3 DAY),
 DATE_ADD(DATE_SUB(NOW(), INTERVAL 3 DAY), INTERVAL 1 HOUR),
 1, '[DEMO] Sinh viên không đến sử dụng', 'S04', NULL, 'NO_SHOW',
 DATE_SUB(NOW(), INTERVAL 4 DAY), NOW());
SET @booking_no_show := LAST_INSERT_ID();

-- --------------------------------------------------------------------------
-- 11. Nhật ký booking
-- --------------------------------------------------------------------------
INSERT INTO booking_audit_logs
    (booking_id, action, performed_by, performed_by_email, performed_at, reason, note)
VALUES
(@booking_pending, 'CREATE_BOOKING', @student_anh, 'sv.anh@eduspace.vn', DATE_SUB(NOW(), INTERVAL 15 MINUTE), 'Sinh viên tạo yêu cầu', '[DEMO] Chờ Staff phê duyệt'),
(@booking_checkin_ready, 'CREATE_BOOKING', @student_nam, 'sv.nam@eduspace.vn', DATE_SUB(NOW(), INTERVAL 1 HOUR), 'Sinh viên tạo booking', '[DEMO] Đặt theo ghế'),
(@booking_confirmed, 'CREATE_BOOKING', @student_ha, 'sv.ha@eduspace.vn', DATE_SUB(NOW(), INTERVAL 2 HOUR), 'Sinh viên tạo yêu cầu', '[DEMO] Đặt theo bàn'),
(@booking_confirmed, 'APPROVE_BOOKING', @staff_id, 'staff@eduspace.vn', DATE_SUB(NOW(), INTERVAL 90 MINUTE), 'Nhân viên phê duyệt', '[DEMO] Chuyển sang CONFIRMED'),
(@booking_checked_in, 'CREATE_BOOKING', @student_anh, 'sv.anh@eduspace.vn', DATE_SUB(NOW(), INTERVAL 3 HOUR), 'Sinh viên tạo yêu cầu', '[DEMO] Đặt theo bàn'),
(@booking_checked_in, 'APPROVE_BOOKING', @staff_id, 'staff@eduspace.vn', DATE_SUB(NOW(), INTERVAL 2 HOUR), 'Nhân viên phê duyệt', '[DEMO] Chuyển sang CONFIRMED'),
(@booking_checked_in, 'CHECK_IN', @staff_id, 'staff@eduspace.vn', DATE_SUB(NOW(), INTERVAL 15 MINUTE), 'Staff hỗ trợ check-in', '[DEMO] Check-in tại quầy'),
(@booking_completed, 'CREATE_BOOKING', @student_nam, 'sv.nam@eduspace.vn', DATE_SUB(NOW(), INTERVAL 2 DAY), 'Sinh viên tạo booking', '[DEMO] Booking lịch sử'),
(@booking_completed, 'CHECK_IN', @student_nam, 'sv.nam@eduspace.vn', DATE_SUB(NOW(), INTERVAL 24 HOUR), 'Sinh viên tự check-in', '[DEMO] Check-in thành công'),
(@booking_completed, 'COMPLETE_TIMEOUT', NULL, 'system@eduspace.vn', DATE_SUB(NOW(), INTERVAL 22 HOUR), 'Hết giờ sử dụng', '[DEMO] Hệ thống hoàn thành booking'),
(@booking_rejected, 'CREATE_BOOKING', @student_ha, 'sv.ha@eduspace.vn', DATE_SUB(NOW(), INTERVAL 4 HOUR), 'Sinh viên tạo yêu cầu', '[DEMO] Chờ duyệt'),
(@booking_rejected, 'REJECT_BOOKING', @staff_id, 'staff@eduspace.vn', DATE_SUB(NOW(), INTERVAL 2 HOUR), 'Chưa cung cấp kế hoạch sử dụng thiết bị.', '[DEMO] Staff từ chối'),
(@booking_cancelled, 'CANCEL_BOOKING', @student_anh, 'sv.anh@eduspace.vn', DATE_SUB(NOW(), INTERVAL 20 HOUR), 'Thay đổi kế hoạch học tập', '[DEMO] Sinh viên chủ động hủy'),
(@booking_expired, 'EXPIRE_TIMEOUT', NULL, 'system@eduspace.vn', DATE_SUB(NOW(), INTERVAL 2 DAY), 'PENDING_APPROVAL_TIMEOUT', '[DEMO] Quá hạn phê duyệt'),
(@booking_no_show, 'NO_SHOW_TIMEOUT', NULL, 'system@eduspace.vn', DATE_ADD(DATE_SUB(NOW(), INTERVAL 3 DAY), INTERVAL 15 MINUTE), 'CHECKIN_WINDOW_EXPIRED', '[DEMO] Quá hạn check-in');

-- --------------------------------------------------------------------------
-- 12. Nhật ký vận hành Staff và nhật ký chính sách
-- --------------------------------------------------------------------------
DELETE FROM staff_audit_logs WHERE details LIKE '[DEMO]%';

INSERT INTO staff_audit_logs
    (actor_user_id, actor_email, action, target_type, target_id, space_id, details, created_at)
VALUES
(@staff_id, 'staff@eduspace.vn', 'BOOKING_APPROVED', 'BOOKING', @booking_confirmed, @space_table, '[DEMO] Duyệt booking đặt theo bàn', DATE_SUB(NOW(), INTERVAL 90 MINUTE)),
(@staff_id, 'staff@eduspace.vn', 'BOOKING_REJECTED', 'BOOKING', @booking_rejected, @space_whole, '[DEMO] Từ chối booking thiếu thông tin', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(@staff_id, 'staff@eduspace.vn', 'STAFF_CHECKED_IN_BOOKING', 'BOOKING', @booking_checked_in, @space_table, '[DEMO] Hỗ trợ sinh viên check-in tại quầy', DATE_SUB(NOW(), INTERVAL 15 MINUTE)),
(@staff_id, 'staff@eduspace.vn', 'MAINTENANCE_CREATED', 'SPACE', @space_whole, @space_whole, '[DEMO] Tạo lịch bảo trì thiết bị', NOW());

DELETE FROM audit_logs WHERE performed_by = 'seed@eduspace.local';

INSERT INTO audit_logs
    (action, target_type, target_id, old_value, new_value, performed_by, performed_at)
VALUES
('UPDATE_POLICY', 'POLICY', 'CHECKIN_OPEN_MINUTES', '10', '15', 'seed@eduspace.local', NOW(6)),
('UPDATE_POLICY', 'POLICY', 'DAILY_BOOKING_QUOTA', '1', '2', 'seed@eduspace.local', NOW(6));

COMMIT;

-- Tóm tắt dữ liệu demo vừa tạo.
SELECT 'users' AS table_name, COUNT(*) AS demo_rows FROM users WHERE email LIKE 'sv.%@eduspace.vn'
UNION ALL
SELECT 'space_types', COUNT(*) FROM space_types WHERE name IN ('Phòng học nhóm nâng cao', 'Khu tự học yên tĩnh', 'Phòng thảo luận linh hoạt')
UNION ALL
SELECT 'facilities', COUNT(*) FROM facilities WHERE name IN ('Bảng tương tác', 'Camera hội nghị', 'Máy tính trình chiếu')
UNION ALL
SELECT 'spaces', COUNT(*) FROM spaces WHERE space_code LIKE 'DEMO-%'
UNION ALL
SELECT 'seats', COUNT(*) FROM seats WHERE space_id = @space_seat AND seat_code LIKE 'S%'
UNION ALL
SELECT 'space_tables', COUNT(*) FROM space_tables WHERE space_id = @space_table AND table_code LIKE 'T%'
UNION ALL
SELECT 'space_facilities', COUNT(*) FROM space_facilities WHERE space_id IN (@space_whole, @space_seat, @space_table)
UNION ALL
SELECT 'booking_policies', COUNT(*) FROM booking_policies WHERE policy_key IN
    ('DAILY_BOOKING_QUOTA', 'MAX_DURATION_MINUTES', 'RATE_LIMIT_HOURLY',
     'CHECKIN_OPEN_MINUTES', 'CHECKIN_GRACE_MINUTES', 'OPENING_HOUR', 'CLOSING_HOUR')
UNION ALL
SELECT 'student_schedules', COUNT(*) FROM student_schedules WHERE course_name LIKE '[DEMO]%'
UNION ALL
SELECT 'maintenance_blocks', COUNT(*) FROM maintenance_blocks WHERE reason LIKE '[DEMO]%'
UNION ALL
SELECT 'bookings', COUNT(*) FROM bookings WHERE purpose LIKE '[DEMO]%'
UNION ALL
SELECT 'booking_audit_logs', COUNT(*) FROM booking_audit_logs WHERE booking_id IN
    (SELECT id FROM bookings WHERE purpose LIKE '[DEMO]%')
UNION ALL
SELECT 'staff_audit_logs', COUNT(*) FROM staff_audit_logs WHERE details LIKE '[DEMO]%'
UNION ALL
SELECT 'audit_logs', COUNT(*) FROM audit_logs WHERE performed_by = 'seed@eduspace.local';
