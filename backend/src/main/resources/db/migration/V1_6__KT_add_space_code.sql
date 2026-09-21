-- ==============================================================================
-- EDUSPACE - MIGRATION V1_6: THÊM CỘT MÃ KHÔNG GIAN (SPACE_CODE)
-- Phân hệ: Quản lý không gian (Nguyễn Thị Kim Tuyến)
-- Bảng: spaces
-- ==============================================================================

-- 1. Thêm cột space_code (tạm thời cho phép NULL để update dữ liệu hiện có)
ALTER TABLE spaces ADD COLUMN space_code VARCHAR(50) NULL AFTER name;

-- 2. Cập nhật mã không gian cho các phòng mẫu hiện có
UPDATE spaces SET space_code = 'G-101' WHERE id = 1 AND space_code IS NULL;
UPDATE spaces SET space_code = 'G-102' WHERE id = 2 AND space_code IS NULL;
UPDATE spaces SET space_code = 'P-201' WHERE id = 3 AND space_code IS NULL;
UPDATE spaces SET space_code = 'S-201' WHERE id = 4 AND space_code IS NULL;
UPDATE spaces SET space_code = 'B-01' WHERE id = 5 AND space_code IS NULL;
UPDATE spaces SET space_code = 'G-103' WHERE id = 6 AND space_code IS NULL;
UPDATE spaces SET space_code = 'D-201' WHERE id = 7 AND space_code IS NULL;

-- Với bất kỳ dòng nào khác nếu có, sinh mã mặc định dựa theo id
UPDATE spaces SET space_code = CONCAT('SP', LPAD(id, 3, '0')) WHERE space_code IS NULL;

-- 3. Chuyển space_code thành NOT NULL và thêm ràng buộc UNIQUE
ALTER TABLE spaces MODIFY COLUMN space_code VARCHAR(50) NOT NULL;
ALTER TABLE spaces ADD CONSTRAINT uq_spaces_space_code UNIQUE (space_code);
