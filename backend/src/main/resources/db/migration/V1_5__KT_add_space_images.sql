-- ==============================================================================
-- EDUSPACE - MIGRATION V1_5: THÊM BẢNG QUẢN LÝ NHIỀU ẢNH CHO KHÔNG GIAN
-- Phân hệ: Quản lý không gian (Nguyễn Thị Kim Tuyến)
-- Bảng: space_images
-- ==============================================================================

CREATE TABLE IF NOT EXISTS space_images (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    space_id BIGINT NOT NULL,
    image_url VARCHAR(1000) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_space_images_space
        FOREIGN KEY (space_id)
        REFERENCES spaces(id)
        ON DELETE CASCADE,
    INDEX idx_space_images_space_id (space_id),
    INDEX idx_space_images_primary (space_id, is_primary)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
