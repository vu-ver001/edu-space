-- ========================================================
-- EduSpace Seed Data Script - Phân hệ: Lõi Đặt Chỗ & Tìm Phòng Khả Dụng
-- Thành viên phụ trách: Nguyễn Thị Khánh Vân (Thành viên 3 - Lead kỹ thuật)
-- Tài liệu tham chiếu: 04_Phan_cong_cong_viec_EduSpace.md (Mục 4.1)
-- 
-- Lưu ý: Script này chỉ nạp dữ liệu mẫu cho các bảng thuộc trách nhiệm của Khánh Vân.
-- Dữ liệu users, spaces, facilities... sẽ được nạp khi pull script của các thành viên tương ứng.
-- ========================================================

USE `eduspace`;

SET FOREIGN_KEY_CHECKS = 0;

-- Xóa dữ liệu cũ của các bảng thuộc phân hệ Đặt chỗ
TRUNCATE TABLE `booking_audit_logs`;
TRUNCATE TABLE `bookings`;
TRUNCATE TABLE `student_schedules`;
TRUNCATE TABLE `booking_policies`;

-- ========================================================
-- 1. Dữ liệu mẫu: Chính sách đặt chỗ (Booking Policies)
-- Phụ trách: Nguyễn Thị Khánh Vân
-- ========================================================
INSERT INTO `booking_policies` (`policy_key`, `policy_value`, `description`) VALUES
('MAX_BOOKING_HOURS_PER_SLOT', '3', 'Thời lượng đặt chỗ tối đa cho một lượt (giờ)'),
('DAILY_BOOKING_QUOTA', '2', 'Hạn mức tối đa số booking đang chiếm chỗ của 1 sinh viên trong ngày'),
('RATE_LIMIT_HOURLY', '10', 'Giới hạn số lần gửi yêu cầu đặt chỗ của 1 sinh viên trong 1 giờ'),
('CHECKIN_OPEN_MINUTES', '15', 'Thời điểm mở cửa sổ check-in trước giờ bắt đầu (phút)'),
('CHECKIN_GRACE_MINUTES', '15', 'Thời gian ân hạn sau giờ bắt đầu trước khi bị tính là No-show (phút)'),
('OPENING_HOUR', '7', 'Giờ mở cửa phục vụ không gian học tập hàng ngày (7h)'),
('CLOSING_HOUR', '22', 'Giờ đóng cửa không gian học tập hàng ngày (22h)'),
('MAX_ADVANCE_DAYS', '7', 'Số ngày tối đa sinh viên được phép đặt trước');

-- ========================================================
-- 2. Dữ liệu mẫu: Thời khóa biểu chính khóa sinh viên (Kiểm tra va chạm lịch học)
-- Phụ trách: Nguyễn Thị Khánh Vân
-- ========================================================
INSERT INTO `student_schedules` (`student_id`, `course_name`, `schedule_date`, `start_time`, `end_time`, `room`) VALUES
(3, 'Phát triển phần mềm dịch vụ', '2026-09-14', '08:00:00', '11:30:00', 'Phòng B2.04'),
(3, 'Kiểm thử phần mềm nâng cao', '2026-09-15', '13:00:00', '16:30:00', 'Phòng C1.02'),
(4, 'Kiến trúc hướng dịch vụ (SOA)', '2026-09-14', '09:00:00', '11:45:00', 'Phòng A3.01'),
(4, 'Phân tích thiết kế hệ thống', '2026-09-16', '07:30:00', '11:00:00', 'Phòng B1.08');

-- ========================================================
-- 3. Dữ liệu mẫu: Các lượt đặt chỗ (Bookings)
-- Phụ trách: Nguyễn Thị Khánh Vân
-- ========================================================
INSERT INTO `bookings` (`id`, `student_id`, `space_id`, `start_time`, `end_time`, `participant_count`, `purpose`, `selected_seats`, `status`) VALUES
(1, 3, 4, '2026-09-14 14:00:00', '2026-09-14 16:00:00', 1, 'Tự học ôn thi cuối kỳ', 'S01', 'CONFIRMED'),
(2, 3, 2, '2026-09-16 14:00:00', '2026-09-16 16:30:00', 4, 'Thảo luận đề tài bài tập lớn EduSpace', '', 'PENDING_APPROVAL');

-- ========================================================
-- 4. Dữ liệu mẫu: Nhật ký thao tác đặt chỗ (Audit Logs)
-- Phụ trách: Nguyễn Thị Khánh Vân
-- ========================================================
INSERT INTO `booking_audit_logs` (`booking_id`, `action`, `performed_by`, `performed_at`, `reason`, `note`) VALUES
(1, 'CREATE_BOOKING', 3, '2026-09-14 07:00:00', 'Sinh viên tạo yêu cầu', 'Phòng PER_SEAT không yêu cầu duyệt -> Xác nhận ngay CONFIRMED'),
(2, 'CREATE_BOOKING', 3, '2026-09-14 07:30:00', 'Sinh viên tạo yêu cầu', 'Phòng WHOLE_SPACE -> Chuyển sang PENDING_APPROVAL chờ Staff duyệt');

SET FOREIGN_KEY_CHECKS = 1;
