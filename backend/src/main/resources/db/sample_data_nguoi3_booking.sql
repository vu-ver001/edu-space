-- ==============================================================================
-- EDUSPACE - CƠ SỞ DỮ LIỆU MẪU: PHÂN HỆ NGƯỜI THỨ 3 (NGUYỄN THỊ KHÁNH VÂN)
-- Module: Booking / Availability Core (Đặt chỗ, Lịch học, Kiểm toán, Chính sách)
-- Đối tượng: Sinh viên Lê Minh Tân (student_id = 3) & các không gian mẫu
-- Ngày tạo: 18/09/2026
-- ==============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------------------
-- 1. BẢNG `booking_policies` (Cấu hình chính sách đặt chỗ toàn hệ thống)
-- ------------------------------------------------------------------------------
INSERT INTO booking_policies (policy_key, policy_value, description, updated_by, updated_at)
VALUES
    ('MAX_HOURS_PER_BOOKING', '3', 'Thời lượng tối đa cho mỗi lượt đặt chỗ (giờ)', 'admin@eduspace.vn', NOW()),
    ('ADVANCE_BOOKING_DAYS', '7', 'Số ngày tối đa được phép đặt trước tính từ hôm nay', 'admin@eduspace.vn', NOW()),
    ('CHECKIN_WINDOW_MINUTES', '15', 'Khoảng thời gian cho phép check-in trước/sau giờ bắt đầu (phút)', 'admin@eduspace.vn', NOW()),
    ('MAX_DAILY_BOOKINGS', '2', 'Số lượt đặt chỗ tối đa đang chiếm chỗ của 1 sinh viên trong ngày', 'admin@eduspace.vn', NOW()),
    ('MAX_CREATE_PER_HOUR', '5', 'Giới hạn số lần gửi yêu cầu tạo booking trong 1 giờ (Rate-limit)', 'admin@eduspace.vn', NOW()),
    ('AUTO_CANCEL_MINUTES', '15', 'Tự động chuyển NO_SHOW sau giờ bắt đầu nếu không check-in (phút)', 'admin@eduspace.vn', NOW())
ON DUPLICATE KEY UPDATE 
    policy_value = VALUES(policy_value),
    description = VALUES(description),
    updated_at = NOW();

-- ------------------------------------------------------------------------------
-- 2. BẢNG `student_schedules` (Lịch học chính khóa để chống đặt trùng lịch học)
-- ------------------------------------------------------------------------------
DELETE FROM student_schedules WHERE student_id = 3;

INSERT INTO student_schedules (student_id, course_name, schedule_date, start_time, end_time, room)
VALUES
    -- Lịch học ngày Thứ Sáu 19/09/2026
    (3, 'Phát triển phần mềm hướng dịch vụ', '2026-09-19', '07:30:00', '11:30:00', 'Phòng B-302'),
    -- Lịch học ngày Thứ Bảy 20/09/2026
    (3, 'Cơ sở dữ liệu nâng cao', '2026-09-20', '13:00:00', '16:30:00', 'Phòng C-101'),
    -- Lịch học ngày Chủ Nhật 21/09/2026
    (3, 'Kiến trúc phần mềm và Thiết kế mẫu', '2026-09-21', '07:30:00', '11:30:00', 'Phòng A-205'),
    -- Lịch học ngày Thứ Hai 22/09/2026
    (3, 'Lập trình ứng dụng Web hiện đại', '2026-09-22', '07:30:00', '11:30:00', 'Phòng Lab-02'),
    -- Lịch học ngày Thứ Ba 23/09/2026
    (3, 'An toàn và Bảo mật hệ thống thông tin', '2026-09-23', '13:30:00', '17:00:00', 'Phòng B-201');

-- ------------------------------------------------------------------------------
-- 3. BẢNG `bookings` (Danh sách các đơn đặt phòng mẫu đa dạng kịch bản & 3 modes)
-- ------------------------------------------------------------------------------
-- Xóa dữ liệu mẫu cũ nếu có để tránh trùng lặp
DELETE FROM booking_audit_logs;
DELETE FROM bookings;

INSERT INTO bookings (
    id, student_id, space_id, table_id, selected_seats, 
    start_time, end_time, participant_count, purpose, status, 
    rejected_by, rejected_at, reject_reason, 
    expired_at, expire_reason, 
    checked_in_at, checked_in_by, 
    created_at, updated_at
) VALUES
    -- [1] WHOLE_SPACE: Đã xác nhận (CONFIRMED) - Space 1 (Phòng G-101)
    (1, 3, 1, NULL, NULL, 
     '2026-09-21 13:00:00', '2026-09-21 15:00:00', 4, 'Học nhóm ôn thi Giữa kỳ môn Kiến trúc phần mềm', 'CONFIRMED', 
     NULL, NULL, NULL, 
     NULL, NULL, 
     NULL, NULL, 
     '2026-09-18 09:00:00', '2026-09-18 09:00:00'),

    -- [2] WHOLE_SPACE: Chờ Staff duyệt (PENDING_APPROVAL) - Space 3 (Phòng P-201, sức chứa 20)
    (2, 3, 3, NULL, NULL, 
     '2026-09-22 09:00:00', '2026-09-22 12:00:00', 15, 'Tổ chức Workshop CLB Tin học sinh viên EduSpace', 'PENDING_APPROVAL', 
     NULL, NULL, NULL, 
     NULL, NULL, 
     NULL, NULL, 
     '2026-09-18 10:15:00', '2026-09-18 10:15:00'),

    -- [3] WHOLE_SPACE: Đã Check-in (CHECKED_IN) - Space 2 (Phòng G-102)
    (3, 3, 2, NULL, NULL, 
     '2026-09-18 14:00:00', '2026-09-18 16:30:00', 6, 'Làm đồ án chuyên ngành nhóm 5', 'CHECKED_IN', 
     NULL, NULL, NULL, 
     NULL, NULL, 
     '2026-09-18 13:52:10', 3, 
     '2026-09-17 16:00:00', '2026-09-18 13:52:10'),

    -- [4] PER_SEAT: Đã xác nhận (CONFIRMED) - Space 4 (Khu tự học S-201, đặt ghế S01,S02)
    (4, 3, 4, NULL, 'S01,S02', 
     '2026-09-20 08:00:00', '2026-09-20 11:00:00', 2, 'Tự học đôi môn Lập trình Web', 'CONFIRMED', 
     NULL, NULL, NULL, 
     NULL, NULL, 
     NULL, NULL, 
     '2026-09-18 11:00:00', '2026-09-18 11:00:00'),

    -- [5] PER_SEAT: Chờ Staff duyệt (PENDING_APPROVAL) - Space 4 (Khu tự học S-201, ghế S05)
    (5, 3, 4, NULL, 'S05', 
     '2026-09-21 08:00:00', '2026-09-21 10:30:00', 1, 'Đọc tài liệu nghiên cứu khoa học', 'PENDING_APPROVAL', 
     NULL, NULL, NULL, 
     NULL, NULL, 
     NULL, NULL, 
     '2026-09-18 14:20:00', '2026-09-18 14:20:00'),

    -- [6] PER_TABLE: Đã xác nhận (CONFIRMED) - Space 7 (Phòng D-201, Bàn T01 capacity 6)
    (6, 3, 7, 1, NULL, 
     '2026-09-20 14:00:00', '2026-09-20 16:30:00', 4, 'Thảo luận nhóm đồ án tại bàn T01', 'CONFIRMED', 
     NULL, NULL, NULL, 
     NULL, NULL, 
     NULL, NULL, 
     '2026-09-18 08:30:00', '2026-09-18 08:30:00'),

    -- [7] PER_TABLE: Chờ Staff duyệt (PENDING_APPROVAL) - Space 7 (Phòng D-201, Bàn T02 capacity 6)
    (7, 3, 7, 2, NULL, 
     '2026-09-22 13:00:00', '2026-09-22 15:30:00', 5, 'Họp nhóm bàn giao mã nguồn', 'PENDING_APPROVAL', 
     NULL, NULL, NULL, 
     NULL, NULL, 
     NULL, NULL, 
     '2026-09-18 15:00:00', '2026-09-18 15:00:00'),

    -- [8] WHOLE_SPACE: Bị Staff từ chối (REJECTED) - Space 3 (Phòng P-201)
    (8, 3, 3, NULL, NULL, 
     '2026-09-19 18:00:00', '2026-09-19 21:00:00', 18, 'Giao lưu văn nghệ buổi tối', 'REJECTED', 
     2, '2026-09-18 11:30:00', 'Không đủ điều kiện tổ chức hoạt động ngoài giờ và không có giảng viên bảo lãnh', 
     NULL, NULL, 
     NULL, NULL, 
     '2026-09-18 09:30:00', '2026-09-18 11:30:00'),

    -- [9] WHOLE_SPACE: Sinh viên tự hủy (CANCELLED) - Space 1 (Phòng G-101)
    (9, 3, 1, NULL, NULL, 
     '2026-09-23 09:00:00', '2026-09-23 11:00:00', 3, 'Họp nhóm (đã hủy do bận lịch thi)', 'CANCELLED', 
     NULL, NULL, NULL, 
     NULL, NULL, 
     NULL, NULL, 
     '2026-09-18 10:00:00', '2026-09-18 12:10:00'),

    -- [10] WHOLE_SPACE: Hết hạn duyệt (EXPIRED) - Space 2 (Phòng G-102)
    (10, 3, 2, NULL, NULL, 
     '2026-09-17 08:00:00', '2026-09-17 10:00:00', 4, 'Học nhóm sáng', 'EXPIRED', 
     NULL, NULL, NULL, 
     '2026-09-17 08:00:00', 'Quá giờ bắt đầu mà Staff chưa kịp duyệt đơn', 
     NULL, NULL, 
     '2026-09-16 15:00:00', '2026-09-17 08:00:00'),

    -- [11] WHOLE_SPACE: Vắng mặt không đến (NO_SHOW) - Space 1 (Phòng G-101)
    (11, 3, 1, NULL, NULL, 
     '2026-09-17 14:00:00', '2026-09-17 16:00:00', 3, 'Thảo luận môn học', 'NO_SHOW', 
     NULL, NULL, NULL, 
     NULL, 'Quá hạn check-in 15 phút mà không điểm danh', 
     NULL, NULL, 
     '2026-09-16 16:00:00', '2026-09-17 14:16:00'),

    -- [12] WHOLE_SPACE: Đã hoàn thành (COMPLETED) - Space 1 (Phòng G-101)
    (12, 3, 1, NULL, NULL, 
     '2026-09-16 09:00:00', '2026-09-16 11:00:00', 5, 'Thuyết trình thử đồ án môn học', 'COMPLETED', 
     NULL, NULL, NULL, 
     NULL, NULL, 
     '2026-09-16 08:52:00', 3, 
     '2026-09-15 14:00:00', '2026-09-16 11:00:00');

-- ------------------------------------------------------------------------------
-- 4. BẢNG `booking_audit_logs` (Nhật ký kiểm toán biến động trạng thái đặt chỗ)
-- ------------------------------------------------------------------------------
INSERT INTO booking_audit_logs (
    id, booking_id, action, performed_by, performed_by_email, performed_at, reason, note
) VALUES
    -- Lịch sử của Booking #1 (Tạo và duyệt tự động)
    (1, 1, 'CREATE_BOOKING', 3, 'student@eduspace.vn', '2026-09-18 09:00:00', NULL, 'Sinh viên tạo đơn đặt phòng trọn gói'),
    (2, 1, 'APPROVE_BOOKING', NULL, 'SYSTEM', '2026-09-18 09:00:00', 'Phòng không yêu cầu duyệt', 'Hệ thống tự động xác nhận CONFIRMED'),

    -- Lịch sử của Booking #2 (Tạo chờ duyệt)
    (3, 2, 'CREATE_BOOKING', 3, 'student@eduspace.vn', '2026-09-18 10:15:00', NULL, 'Sinh viên tạo đơn chờ duyệt do phòng lớn yêu cầu phê duyệt'),

    -- Lịch sử của Booking #3 (Tạo, duyệt và check-in)
    (4, 3, 'CREATE_BOOKING', 3, 'student@eduspace.vn', '2026-09-17 16:00:00', NULL, 'Sinh viên tạo đơn đặt phòng'),
    (5, 3, 'CHECK_IN', 3, 'student@eduspace.vn', '2026-09-18 13:52:10', 'Check-in đúng giờ qua cổng sinh viên', 'Điểm danh thành công lúc 13:52'),

    -- Lịch sử của Booking #4 (Đặt ghế PER_SEAT)
    (6, 4, 'CREATE_BOOKING', 3, 'student@eduspace.vn', '2026-09-18 11:00:00', NULL, 'Đặt 2 ghế S01,S02 tại Khu tự học S-201'),

    -- Lịch sử của Booking #6 (Đặt bàn PER_TABLE)
    (7, 6, 'CREATE_BOOKING', 3, 'student@eduspace.vn', '2026-09-18 08:30:00', NULL, 'Đặt bàn T01 tại Phòng D-201'),

    -- Lịch sử của Booking #8 (Staff từ chối)
    (8, 8, 'CREATE_BOOKING', 3, 'student@eduspace.vn', '2026-09-18 09:30:00', NULL, 'Sinh viên tạo đơn đặt phòng hội thảo P-201'),
    (9, 8, 'REJECT_BOOKING', 2, 'staff@eduspace.vn', '2026-09-18 11:30:00', 'Không đủ điều kiện tổ chức ngoài giờ', 'Staff từ chối đơn đặt phòng'),

    -- Lịch sử của Booking #9 (Sinh viên hủy)
    (10, 9, 'CREATE_BOOKING', 3, 'student@eduspace.vn', '2026-09-18 10:00:00', NULL, 'Sinh viên tạo đơn đặt phòng G-101'),
    (11, 9, 'CANCEL_BOOKING', 3, 'student@eduspace.vn', '2026-09-18 12:10:00', 'Bận lịch thi đột xuất', 'Sinh viên chủ động hủy đơn trước giờ bắt đầu'),

    -- Lịch sử của Booking #10 (Hết hạn duyệt)
    (12, 10, 'CREATE_BOOKING', 3, 'student@eduspace.vn', '2026-09-16 15:00:00', NULL, 'Tạo đơn chờ Staff duyệt'),
    (13, 10, 'EXPIRE_TIMEOUT', NULL, 'SYSTEM', '2026-09-17 08:00:00', 'Quá giờ bắt đầu', 'Scheduler tự động chuyển trạng thái sang EXPIRED'),

    -- Lịch sử của Booking #11 (Vắng mặt No-show)
    (14, 11, 'CREATE_BOOKING', 3, 'student@eduspace.vn', '2026-09-16 16:00:00', NULL, 'Tạo đơn đặt phòng'),
    (15, 11, 'NO_SHOW_TIMEOUT', NULL, 'SYSTEM', '2026-09-17 14:16:00', 'Quá 15 phút không check-in', 'Scheduler tự động chuyển trạng thái sang NO_SHOW'),

    -- Lịch sử của Booking #12 (Hoàn thành lượt dùng)
    (16, 12, 'CREATE_BOOKING', 3, 'student@eduspace.vn', '2026-09-15 14:00:00', NULL, 'Tạo đơn đặt phòng'),
    (17, 12, 'CHECK_IN', 3, 'student@eduspace.vn', '2026-09-16 08:52:00', 'Điểm danh hợp lệ', 'Check-in thành công'),
    (18, 12, 'COMPLETE_TIMEOUT', NULL, 'SYSTEM', '2026-09-16 11:00:00', 'Hết giờ sử dụng', 'Scheduler tự động chuyển trạng thái sang COMPLETED');

SET FOREIGN_KEY_CHECKS = 1;
