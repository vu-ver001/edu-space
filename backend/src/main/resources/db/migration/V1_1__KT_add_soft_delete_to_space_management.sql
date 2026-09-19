-- ====================================================================
-- MIGRATION: Bổ sung soft delete cho module Quản lý không gian (Kim Tuyến)
-- ====================================================================

ALTER TABLE space_types
ADD COLUMN deleted_at DATETIME NULL;

ALTER TABLE spaces
ADD COLUMN deleted_at DATETIME NULL,
MODIFY COLUMN floor VARCHAR(20) NOT NULL;

ALTER TABLE seats
ADD COLUMN deleted_at DATETIME NULL;

ALTER TABLE facilities
ADD COLUMN deleted_at DATETIME NULL;

-- Indexes hỗ trợ lọc deleted_at IS NULL
CREATE INDEX idx_spaces_deleted_at ON spaces (deleted_at);
CREATE INDEX idx_seats_deleted_at ON seats (deleted_at);
