-- ====================================================================
-- EDU-SPACE DATABASE SCHEMA — PHẦN NGUYỄN THỊ KIM TUYẾN
-- Bổ sung Soft Delete (deleted_at) cho space_types, spaces, seats, facilities
-- ====================================================================

-- 1. Bảng loại không gian học tập (hỗ trợ booking_mode & soft delete)
CREATE TABLE IF NOT EXISTS space_types (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    booking_mode VARCHAR(20) NOT NULL DEFAULT 'WHOLE_SPACE',
    requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_space_types_name UNIQUE (name),
    CONSTRAINT chk_space_types_booking_mode CHECK (booking_mode IN ('WHOLE_SPACE', 'PER_SEAT', 'PER_TABLE'))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 2. Bảng không gian / phòng học cụ thể (hỗ trợ soft delete)
CREATE TABLE IF NOT EXISTS spaces (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    space_code VARCHAR(50) NOT NULL,
    space_type_id BIGINT NOT NULL,
    building VARCHAR(100) NOT NULL,
    floor VARCHAR(20) NOT NULL,
    capacity INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    description TEXT NULL,
    deleted_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_spaces_capacity CHECK (capacity > 0),
    CONSTRAINT chk_spaces_status CHECK (status IN ('AVAILABLE', 'MAINTENANCE', 'INACTIVE')),
    CONSTRAINT uq_spaces_space_code UNIQUE (space_code),
    CONSTRAINT fk_spaces_space_type FOREIGN KEY (space_type_id) REFERENCES space_types (id) ON DELETE RESTRICT
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 3. Bảng chỗ ngồi cụ thể (chỉ dành cho spaces có booking_mode = PER_SEAT, hỗ trợ soft delete)
CREATE TABLE IF NOT EXISTS seats (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    space_id BIGINT NOT NULL,
    seat_code VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    description TEXT NULL,
    deleted_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_seats_status CHECK (status IN ('AVAILABLE', 'INACTIVE')),
    CONSTRAINT uq_seats_space_seat_code UNIQUE (space_id, seat_code),
    CONSTRAINT fk_seats_space FOREIGN KEY (space_id) REFERENCES spaces (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 4. Bảng danh mục tiện ích phòng (hỗ trợ soft delete)
CREATE TABLE IF NOT EXISTS facilities (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    deleted_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_facilities_name UNIQUE (name)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 5. Bảng liên kết nhiều-nhiều giữa phòng và tiện ích (KHÔNG soft delete)
CREATE TABLE IF NOT EXISTS space_facilities (
    space_id BIGINT NOT NULL,
    facility_id BIGINT NOT NULL,
    PRIMARY KEY (space_id, facility_id),
    CONSTRAINT fk_sf_space FOREIGN KEY (space_id) REFERENCES spaces (id) ON DELETE CASCADE,
    CONSTRAINT fk_sf_facility FOREIGN KEY (facility_id) REFERENCES facilities (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 6. Bảng bàn thảo luận cụ thể (chỉ dành cho spaces có booking_mode = PER_TABLE, hỗ trợ soft delete)
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
    CONSTRAINT chk_space_tables_capacity CHECK (capacity > 0),
    CONSTRAINT chk_space_tables_status CHECK (status IN ('AVAILABLE', 'INACTIVE')),
    CONSTRAINT uk_space_table_code UNIQUE (space_id, table_code),
    CONSTRAINT fk_space_tables_space FOREIGN KEY (space_id) REFERENCES spaces (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ====================================================================
-- INDEXES HỖ TRỢ TRUY VẤN VÀ TỐI ƯU
-- ====================================================================
CREATE INDEX idx_spaces_search ON spaces (status, space_type_id, capacity);
CREATE INDEX idx_spaces_building ON spaces (building, floor);
CREATE INDEX idx_spaces_deleted_at ON spaces (deleted_at);
CREATE INDEX idx_seats_space_status ON seats (space_id, status);
CREATE INDEX idx_seats_deleted_at ON seats (deleted_at);
CREATE INDEX idx_space_tables_space_status ON space_tables (space_id, status);
CREATE INDEX idx_space_tables_deleted_at ON space_tables (deleted_at);
