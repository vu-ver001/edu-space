-- ============================================================================
-- EduSpace - Booking mẫu đang chờ duyệt cho màn hình quản lý của Staff
-- Chỉ làm mới các booking có mục đích bắt đầu bằng [DEMO-PENDING].
-- Có thể chạy lại file này để khôi phục danh sách chờ duyệt ban đầu.
-- ============================================================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET time_zone = '+07:00';
USE eduspace;

START TRANSACTION;

-- Dùng mật khẩu của tài khoản sinh viên có sẵn. Nếu chưa có thì dùng hash của 123456.
SET @demo_password := COALESCE(
    (SELECT password FROM users WHERE role = 'STUDENT' LIMIT 1),
    '$2a$10$XPrJX/BgkfBcGGHJtDVUmefiCIdNdlHBgAg6h3.DPSQbrW1.tK5S2'
);

-- Sinh viên mẫu để danh sách chờ duyệt có nhiều người khác nhau.
INSERT INTO users (email, password, full_name, phone_number, role, is_active)
VALUES
    ('sv.anh@eduspace.vn', @demo_password, 'Nguyễn Minh Anh', '0987654321', 'STUDENT', TRUE),
    ('sv.nam@eduspace.vn', @demo_password, 'Trần Hoàng Nam', '0987654322', 'STUDENT', TRUE),
    ('sv.ha@eduspace.vn', @demo_password, 'Lê Thu Hà', '0987654323', 'STUDENT', TRUE),
    ('sv.bao@eduspace.vn', @demo_password, 'Phạm Gia Bảo', '0987654324', 'STUDENT', TRUE),
    ('sv.chi@eduspace.vn', @demo_password, 'Ngô Quỳnh Chi', '0987654325', 'STUDENT', TRUE)
ON DUPLICATE KEY UPDATE
    full_name = VALUES(full_name),
    phone_number = VALUES(phone_number),
    role = 'STUDENT',
    is_active = TRUE;

SET @student_anh := (SELECT id FROM users WHERE email = 'sv.anh@eduspace.vn' LIMIT 1);
SET @student_nam := (SELECT id FROM users WHERE email = 'sv.nam@eduspace.vn' LIMIT 1);
SET @student_ha := (SELECT id FROM users WHERE email = 'sv.ha@eduspace.vn' LIMIT 1);
SET @student_bao := (SELECT id FROM users WHERE email = 'sv.bao@eduspace.vn' LIMIT 1);
SET @student_chi := (SELECT id FROM users WHERE email = 'sv.chi@eduspace.vn' LIMIT 1);

-- Các không gian này thuộc loại yêu cầu Staff phê duyệt.
SET @space_p201 := (SELECT id FROM spaces WHERE space_code = 'P-201' AND deleted_at IS NULL LIMIT 1);
SET @space_clb401 := (SELECT id FROM spaces WHERE space_code = 'CLB-401' AND deleted_at IS NULL LIMIT 1);

-- Dừng sớm bằng lỗi khóa ngoại dễ hiểu nếu chưa chạy data-kimtuyen.sql.
-- Hai biến trên phải có giá trị trước khi thêm booking.

-- Xóa đúng nhóm booking demo cũ để chạy lại không tạo dữ liệu trùng.
DROP TEMPORARY TABLE IF EXISTS demo_pending_booking_ids;
CREATE TEMPORARY TABLE demo_pending_booking_ids AS
SELECT id
FROM bookings
WHERE purpose LIKE '[DEMO-PENDING]%';

DELETE FROM booking_audit_logs
WHERE booking_id IN (SELECT id FROM demo_pending_booking_ids);

DELETE FROM staff_audit_logs
WHERE target_type = 'BOOKING'
  AND target_id IN (SELECT id FROM demo_pending_booking_ids);

DELETE FROM bookings
WHERE id IN (SELECT id FROM demo_pending_booking_ids);

DROP TEMPORARY TABLE demo_pending_booking_ids;

-- Tất cả start_time đều ở tương lai để scheduler không chuyển thành EXPIRED.
INSERT INTO bookings
    (student_id, space_id, start_time, end_time, participant_count, purpose,
     selected_seats, table_id, status, created_at, updated_at)
VALUES
    (@student_anh, @space_p201,
     DATE_ADD(CURDATE(), INTERVAL 1 DAY) + INTERVAL 9 HOUR,
     DATE_ADD(CURDATE(), INTERVAL 1 DAY) + INTERVAL 11 HOUR,
     8, '[DEMO-PENDING] Thuyết trình đồ án môn học', NULL, NULL,
     'PENDING_APPROVAL', DATE_SUB(NOW(), INTERVAL 2 DAY), NOW()),

    (@student_nam, @space_p201,
     DATE_ADD(CURDATE(), INTERVAL 1 DAY) + INTERVAL 13 HOUR,
     DATE_ADD(CURDATE(), INTERVAL 1 DAY) + INTERVAL 15 HOUR,
     12, '[DEMO-PENDING] Báo cáo tiến độ dự án nhóm', NULL, NULL,
     'PENDING_APPROVAL', DATE_SUB(NOW(), INTERVAL 1 DAY), NOW()),

    (@student_ha, @space_clb401,
     DATE_ADD(CURDATE(), INTERVAL 2 DAY) + INTERVAL 8 HOUR,
     DATE_ADD(CURDATE(), INTERVAL 2 DAY) + INTERVAL 10 HOUR,
     20, '[DEMO-PENDING] Họp ban tổ chức câu lạc bộ', NULL, NULL,
     'PENDING_APPROVAL', DATE_SUB(NOW(), INTERVAL 10 HOUR), NOW()),

    (@student_bao, @space_p201,
     DATE_ADD(CURDATE(), INTERVAL 2 DAY) + INTERVAL 14 HOUR,
     DATE_ADD(CURDATE(), INTERVAL 2 DAY) + INTERVAL 16 HOUR,
     15, '[DEMO-PENDING] Tập dượt thuyết trình cuối kỳ', NULL, NULL,
     'PENDING_APPROVAL', DATE_SUB(NOW(), INTERVAL 5 HOUR), NOW()),

    (@student_chi, @space_clb401,
     DATE_ADD(CURDATE(), INTERVAL 3 DAY) + INTERVAL 9 HOUR,
     DATE_ADD(CURDATE(), INTERVAL 3 DAY) + INTERVAL 12 HOUR,
     25, '[DEMO-PENDING] Workshop chia sẻ kỹ năng học tập', NULL, NULL,
     'PENDING_APPROVAL', DATE_SUB(NOW(), INTERVAL 3 HOUR), NOW()),

    (@student_anh, @space_clb401,
     DATE_ADD(CURDATE(), INTERVAL 4 DAY) + INTERVAL 13 HOUR,
     DATE_ADD(CURDATE(), INTERVAL 4 DAY) + INTERVAL 15 HOUR,
     18, '[DEMO-PENDING] Sinh hoạt câu lạc bộ học thuật', NULL, NULL,
     'PENDING_APPROVAL', DATE_SUB(NOW(), INTERVAL 90 MINUTE), NOW()),

    (@student_nam, @space_p201,
     DATE_ADD(CURDATE(), INTERVAL 5 DAY) + INTERVAL 8 HOUR,
     DATE_ADD(CURDATE(), INTERVAL 5 DAY) + INTERVAL 10 HOUR,
     10, '[DEMO-PENDING] Bảo vệ bài tập lớn', NULL, NULL,
     'PENDING_APPROVAL', DATE_SUB(NOW(), INTERVAL 30 MINUTE), NOW()),

    (@student_ha, @space_clb401,
     DATE_ADD(CURDATE(), INTERVAL 6 DAY) + INTERVAL 15 HOUR,
     DATE_ADD(CURDATE(), INTERVAL 6 DAY) + INTERVAL 17 HOUR,
     30, '[DEMO-PENDING] Tổ chức buổi định hướng thành viên mới', NULL, NULL,
     'PENDING_APPROVAL', DATE_SUB(NOW(), INTERVAL 10 MINUTE), NOW());

COMMIT;

-- Kiểm tra nhanh kết quả vừa tạo.
SELECT
    b.id AS booking_id,
    u.full_name AS student_name,
    s.space_code,
    s.name AS space_name,
    b.start_time,
    b.end_time,
    b.participant_count,
    b.purpose,
    b.status,
    b.created_at
FROM bookings b
JOIN users u ON u.id = b.student_id
JOIN spaces s ON s.id = b.space_id
WHERE b.purpose LIKE '[DEMO-PENDING]%'
ORDER BY b.created_at ASC;
