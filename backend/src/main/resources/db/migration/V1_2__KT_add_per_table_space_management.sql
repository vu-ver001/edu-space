-- ====================================================================
-- MIGRATION: Bổ sung PER_TABLE cho module Quản lý không gian (Kim Tuyến)
-- ====================================================================

-- 1. Cập nhật CHECK constraint trên space_types để chấp nhận PER_TABLE
ALTER TABLE space_types
DROP CONSTRAINT IF EXISTS chk_space_types_booking_mode;

ALTER TABLE space_types
ADD CONSTRAINT chk_space_types_booking_mode
CHECK (booking_mode IN ('WHOLE_SPACE', 'PER_SEAT', 'PER_TABLE'));

-- 2. Tạo bảng space_tables
CREATE TABLE IF NOT EXISTS space_tables (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    space_id BIGINT NOT NULL,
    table_code VARCHAR(50) NOT NULL,
    capacity INT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE',
    description TEXT NULL,
    deleted_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_space_tables_space
        FOREIGN KEY (space_id)
        REFERENCES spaces(id)
        ON DELETE CASCADE,

    CONSTRAINT uk_space_table_code
        UNIQUE (space_id, table_code),

    CONSTRAINT chk_space_tables_capacity
        CHECK (capacity > 0),

    CONSTRAINT chk_space_tables_status
        CHECK (status IN ('AVAILABLE', 'INACTIVE'))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 3. Indexes hỗ trợ truy vấn và soft delete
CREATE INDEX idx_space_tables_space_status ON space_tables (space_id, status);
CREATE INDEX idx_space_tables_deleted_at ON space_tables (deleted_at);
