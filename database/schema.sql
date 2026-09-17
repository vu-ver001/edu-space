-- ========================================================
-- EduSpace Database Schema - Phân hệ: Lõi Đặt Chỗ & Tìm Phòng Khả Dụng
-- Thành viên phụ trách: Nguyễn Thị Khánh Vân (Thành viên 3 - Lead kỹ thuật)
-- Tài liệu tham chiếu: 04_Phan_cong_cong_viec_EduSpace.md (Mục 4.1)
-- 
-- Lưu ý: Các bảng của thành viên khác (users, spaces, facilities, maintenance_blocks...)
-- sẽ được hợp nhất khi pull code từ repository của các bạn.
-- ========================================================

CREATE DATABASE IF NOT EXISTS `eduspace` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `eduspace`;

-- Tạm tắt kiểm tra khóa ngoại để script chạy độc lập trước khi pull bảng của các bạn
SET FOREIGN_KEY_CHECKS = 0;

-- ========================================================
-- 1. Bảng thời khóa biểu chính khóa sinh viên (Mock/seed kiểm tra trùng lịch học)
-- Phụ trách: Nguyễn Thị Khánh Vân
-- Nghiệp vụ: Chặn sinh viên đặt phòng vào khung giờ đang có lịch học trên lớp
-- ========================================================
CREATE TABLE IF NOT EXISTS `student_schedules` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `student_id` BIGINT NOT NULL COMMENT 'Liên kết users(id) - Lê Minh Tân phụ trách',
    `course_name` VARCHAR(150) NOT NULL COMMENT 'Tên môn học',
    `schedule_date` DATE NOT NULL COMMENT 'Ngày học',
    `start_time` TIME NOT NULL COMMENT 'Giờ bắt đầu',
    `end_time` TIME NOT NULL COMMENT 'Giờ kết thúc',
    `room` VARCHAR(50) COMMENT 'Phòng học chính khóa',
    CONSTRAINT `fk_sched_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    INDEX `idx_sched_student_date` (`student_id`, `schedule_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================================
-- 2. Bảng cấu hình chính sách đặt chỗ (Booking Policies)
-- Phụ trách: Nguyễn Thị Khánh Vân
-- Nghiệp vụ: Lưu các tham số hạn mức: số booking/ngày, max duration, rate limit...
-- ========================================================
CREATE TABLE IF NOT EXISTS `booking_policies` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `policy_key` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Khóa định danh chính sách',
    `policy_value` VARCHAR(100) NOT NULL COMMENT 'Giá trị cấu hình',
    `description` VARCHAR(255) COMMENT 'Mô tả ý nghĩa chính sách',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================================
-- 3. Bảng Quản lý Đặt chỗ (Lõi hệ thống EduSpace)
-- Phụ trách: Nguyễn Thị Khánh Vân
-- Nghiệp vụ: Lưu trữ các lượt đặt chỗ, kiểm soát xung đột giờ & ghế, vòng đời booking
-- ========================================================
CREATE TABLE IF NOT EXISTS `bookings` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `student_id` BIGINT NOT NULL COMMENT 'Liên kết users(id) - Lê Minh Tân phụ trách',
    `space_id` BIGINT NOT NULL COMMENT 'Liên kết spaces(id) - Nguyễn Thị Kim Tuyến phụ trách',
    `start_time` DATETIME NOT NULL COMMENT 'Thời gian bắt đầu sử dụng',
    `end_time` DATETIME NOT NULL COMMENT 'Thời gian kết thúc sử dụng',
    `participant_count` INT NOT NULL COMMENT 'Số lượng người tham gia',
    `purpose` VARCHAR(255) COMMENT 'Mục đích sử dụng phòng',
    `selected_seats` VARCHAR(255) NULL COMMENT 'Danh sách mã ghế ngồi đã chọn (ví dụ: A1,A2,B1)',
    `status` ENUM(
        'PENDING_APPROVAL',
        'CONFIRMED',
        'CHECKED_IN',
        'REJECTED',
        'CANCELLED',
        'EXPIRED',
        'NO_SHOW',
        'COMPLETED'
    ) NOT NULL DEFAULT 'CONFIRMED' COMMENT 'Trạng thái vòng đời booking',
    `rejected_by` BIGINT NULL COMMENT 'Liên kết users(id) - Người từ chối (Staff/Admin)',
    `rejected_at` DATETIME NULL COMMENT 'Thời điểm từ chối',
    `reject_reason` TEXT NULL COMMENT 'Lý do từ chối bắt buộc',
    `expired_at` DATETIME NULL COMMENT 'Thời điểm tự động hết hạn chờ duyệt',
    `expire_reason` VARCHAR(100) NULL COMMENT 'Lý do hết hạn',
    `checked_in_at` DATETIME NULL COMMENT 'Thời điểm check-in thành công',
    `checked_in_by` BIGINT NULL COMMENT 'Liên kết users(id) - Người xác nhận check-in',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_booking_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_booking_space` FOREIGN KEY (`space_id`) REFERENCES `spaces` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_booking_rejector` FOREIGN KEY (`rejected_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_booking_checkin_by` FOREIGN KEY (`checked_in_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    INDEX `idx_space_status_time` (`space_id`, `status`, `start_time`, `end_time`),
    INDEX `idx_student_status_time` (`student_id`, `status`, `start_time`, `end_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================================
-- 4. Bảng nhật ký thao tác đặt chỗ (Audit Logs dùng chung)
-- Phụ trách: Nguyễn Thị Khánh Vân
-- Nghiệp vụ: Lưu vết lịch sử chuyển trạng thái, thao tác tạo/hủy/duyệt/check-in
-- ========================================================
CREATE TABLE IF NOT EXISTS `booking_audit_logs` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `booking_id` BIGINT NOT NULL COMMENT 'Liên kết bookings(id)',
    `action` VARCHAR(50) NOT NULL COMMENT 'Hành động: CREATE, APPROVE, REJECT, CANCEL, CHECK_IN, EXPIRE...',
    `performed_by` BIGINT NULL COMMENT 'Liên kết users(id) - Người thực hiện thao tác',
    `performed_at` DATETIME NOT NULL COMMENT 'Thời điểm thực hiện',
    `reason` VARCHAR(255) NULL COMMENT 'Lý do thao tác',
    `note` TEXT NULL COMMENT 'Ghi chú bổ sung',
    CONSTRAINT `fk_audit_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_audit_user` FOREIGN KEY (`performed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    INDEX `idx_audit_booking` (`booking_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
