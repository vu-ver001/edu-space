-- ====================================================================
-- MIGRATION: Bổ sung soft delete cho maintenance_blocks và bảng staff_audit_logs
-- Phân hệ: Vận hành dành cho Staff (Nguyễn Thị Kim Tuyến)
-- ====================================================================

-- 1. Bổ sung cột deleted_at cho bảng maintenance_blocks nếu chưa có
ALTER TABLE `maintenance_blocks`
ADD COLUMN `deleted_at` DATETIME(6) NULL DEFAULT NULL AFTER `created_by`;

-- 2. Tạo index hỗ trợ tra cứu khoảng bảo trì active
CREATE INDEX `idx_maintenance_space_time_del` 
ON `maintenance_blocks` (`space_id`, `start_time`, `end_time`, `deleted_at`);

-- 3. Tạo bảng lưu nhật ký thao tác vận hành của Staff (Staff Audit Logs)
CREATE TABLE IF NOT EXISTS `staff_audit_logs` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `actor_user_id` BIGINT NOT NULL COMMENT 'ID của Staff/Admin thực hiện',
    `actor_email` VARCHAR(150) NULL COMMENT 'Email của Staff/Admin',
    `action` VARCHAR(50) NOT NULL COMMENT 'BOOKING_APPROVED, BOOKING_REJECTED, MAINTENANCE_CREATED...',
    `target_type` VARCHAR(50) NOT NULL COMMENT 'BOOKING hoặc MAINTENANCE',
    `target_id` BIGINT NOT NULL COMMENT 'ID của booking hoặc maintenance_block',
    `space_id` BIGINT NULL COMMENT 'ID không gian liên quan (nếu có)',
    `details` TEXT NULL COMMENT 'Chi tiết lý do hoặc ghi chú thao tác',
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    INDEX `idx_staff_audit_action` (`action`),
    INDEX `idx_staff_audit_target` (`target_type`, `target_id`),
    INDEX `idx_staff_audit_space` (`space_id`),
    INDEX `idx_staff_audit_actor` (`actor_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
