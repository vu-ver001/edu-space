-- ============================================================================
-- EduSpace - Booking mẫu đang chờ check-in cho màn hình quản lý của Staff
--
-- Tạo 3 booking CONFIRMED bắt đầu sau 1, 5 và 10 phút kể từ lúc chạy.
-- Với CHECKIN_OPEN_MINUTES mặc định là 15, cả 3 đều check-in được ngay.
-- Chỉ làm mới dữ liệu có purpose bắt đầu bằng [DEMO-CHECKIN], nên có thể chạy lại.
-- Yêu cầu: đã có các không gian G-101, G-102 và B-301 từ data-kimtuyen.sql.
-- ============================================================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET time_zone = '+07:00';
USE eduspace;

START TRANSACTION;

-- Giữ cùng mật khẩu với một tài khoản sinh viên sẵn có để có thể đăng nhập thử.
SET @demo_password := COALESCE(
    (SELECT password FROM users WHERE role = 'STUDENT' LIMIT 1),
    '$2a$10$XPrJX/BgkfBcGGHJtDVUmefiCIdNdlHBgAg6h3.DPSQbrW1.tK5S2'
);

INSERT INTO users
    (username, email, password, full_name, phone_number, role, is_active,
     user_code, class_name)
VALUES
    ('kt.checkin01', 'sv.checkin01@eduspace.vn', @demo_password,
     'Nguyễn Minh Anh', '0987654311', 'STUDENT', TRUE, 'SV-CI001', 'CNTT-K18A'),
    ('kt.checkin02', 'sv.checkin02@eduspace.vn', @demo_password,
     'Trần Hoàng Nam', '0987654312', 'STUDENT', TRUE, 'SV-CI002', 'CNTT-K18B'),
    ('kt.checkin03', 'sv.checkin03@eduspace.vn', @demo_password,
     'Lê Thu Hà', '0987654313', 'STUDENT', TRUE, 'SV-CI003', 'HTTT-K18A')
ON DUPLICATE KEY UPDATE
    username = VALUES(username),
    full_name = VALUES(full_name),
    phone_number = VALUES(phone_number),
    role = 'STUDENT',
    is_active = TRUE,
    user_code = VALUES(user_code),
    class_name = VALUES(class_name);

SET @student_checkin_01 := (
    SELECT id FROM users WHERE email = 'sv.checkin01@eduspace.vn' LIMIT 1
);
SET @student_checkin_02 := (
    SELECT id FROM users WHERE email = 'sv.checkin02@eduspace.vn' LIMIT 1
);
SET @student_checkin_03 := (
    SELECT id FROM users WHERE email = 'sv.checkin03@eduspace.vn' LIMIT 1
);

SET @space_checkin_01 := (
    SELECT id FROM spaces
    WHERE space_code = 'G-101' AND deleted_at IS NULL
    LIMIT 1
);
SET @space_checkin_02 := (
    SELECT id FROM spaces
    WHERE space_code = 'G-102' AND deleted_at IS NULL
    LIMIT 1
);
SET @space_checkin_03 := (
    SELECT id FROM spaces
    WHERE space_code = 'B-301' AND deleted_at IS NULL
    LIMIT 1
);

-- Xóa đúng nhóm demo check-in cũ trước khi tạo lại.
DROP TEMPORARY TABLE IF EXISTS demo_checkin_booking_ids;
CREATE TEMPORARY TABLE demo_checkin_booking_ids AS
SELECT id
FROM bookings
WHERE purpose LIKE '[DEMO-CHECKIN]%';

DELETE FROM checkin_tokens
WHERE booking_id IN (SELECT id FROM demo_checkin_booking_ids);

DELETE FROM booking_audit_logs
WHERE booking_id IN (SELECT id FROM demo_checkin_booking_ids);

DELETE FROM staff_audit_logs
WHERE target_type = 'BOOKING'
  AND target_id IN (SELECT id FROM demo_checkin_booking_ids);

DELETE FROM bookings
WHERE id IN (SELECT id FROM demo_checkin_booking_ids);

DROP TEMPORARY TABLE demo_checkin_booking_ids;

-- Mỗi booking dùng một không gian riêng để không tạo xung đột thời gian.
INSERT INTO bookings
    (booking_code, student_id, space_id, start_time, end_time,
     participant_count, purpose, selected_seats, table_id, status,
     created_at, updated_at)
VALUES
    (CONCAT('BK-CI-', DATE_FORMAT(NOW(), '%y%m%d'), '-01'),
     @student_checkin_01, @space_checkin_01,
     DATE_ADD(NOW(), INTERVAL 1 MINUTE), DATE_ADD(NOW(), INTERVAL 61 MINUTE),
     4, '[DEMO-CHECKIN] Học nhóm chuẩn bị kiểm tra', NULL, NULL, 'CONFIRMED',
     DATE_SUB(NOW(), INTERVAL 1 DAY), NOW()),

    (CONCAT('BK-CI-', DATE_FORMAT(NOW(), '%y%m%d'), '-02'),
     @student_checkin_02, @space_checkin_02,
     DATE_ADD(NOW(), INTERVAL 5 MINUTE), DATE_ADD(NOW(), INTERVAL 65 MINUTE),
     6, '[DEMO-CHECKIN] Thảo luận đồ án cuối kỳ', NULL, NULL, 'CONFIRMED',
     DATE_SUB(NOW(), INTERVAL 12 HOUR), NOW()),

    (CONCAT('BK-CI-', DATE_FORMAT(NOW(), '%y%m%d'), '-03'),
     @student_checkin_03, @space_checkin_03,
     DATE_ADD(NOW(), INTERVAL 10 MINUTE), DATE_ADD(NOW(), INTERVAL 70 MINUTE),
     2, '[DEMO-CHECKIN] Ôn tập theo nhóm nhỏ', NULL, NULL, 'CONFIRMED',
     DATE_SUB(NOW(), INTERVAL 6 HOUR), NOW());

-- Ghi nhận lịch sử tạo booking để dữ liệu mẫu đầy đủ như booking thật.
INSERT INTO booking_audit_logs
    (booking_id, action, performed_by, performed_by_email,
     performed_at, reason, note)
SELECT
    b.id,
    'CREATE_BOOKING',
    b.student_id,
    u.email,
    b.created_at,
    'Dữ liệu mẫu phục vụ kiểm thử check-in',
    'Booking mẫu đã được xác nhận và đang trong cửa sổ check-in'
FROM bookings b
JOIN users u ON u.id = b.student_id
WHERE b.purpose LIKE '[DEMO-CHECKIN]%';

COMMIT;

-- Kiểm tra nhanh: can_check_in_now phải bằng 1 cho cả 3 dòng ngay sau khi chạy.
SELECT
    b.id AS booking_id,
    b.booking_code,
    u.full_name AS student_name,
    u.user_code,
    u.class_name,
    s.space_code,
    b.start_time,
    b.end_time,
    TIMESTAMPDIFF(MINUTE, NOW(), b.start_time) AS minutes_until_start,
    (NOW() BETWEEN DATE_SUB(b.start_time, INTERVAL 15 MINUTE)
               AND DATE_ADD(b.start_time, INTERVAL 15 MINUTE)) AS can_check_in_now,
    b.status
FROM bookings b
JOIN users u ON u.id = b.student_id
JOIN spaces s ON s.id = b.space_id
WHERE b.purpose LIKE '[DEMO-CHECKIN]%'
ORDER BY b.start_time ASC;
