-- ============================================================================
-- EduSpace - Dữ liệu mẫu phần Nguyễn Thị Kim Tuyến
-- Phạm vi: loại không gian, tiện ích, không gian, ghế, bàn, liên kết tiện ích,
--          hình ảnh không gian.
--
-- Có thể chạy lại nhiều lần: dữ liệu được nhận diện bằng tên hoặc mã duy nhất,
-- không dùng ID cố định nên không ghi đè bản ghi của thành viên khác.
-- Yêu cầu: đã chạy schema-kimtuyen.sql và các migration V1_1, V1_2, V1_5, V1_6.
-- ============================================================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET time_zone = '+07:00';
USE eduspace;

START TRANSACTION;

-- --------------------------------------------------------------------------
-- 1. Loại không gian
-- Các ngày tạo được đặt lệch nhau để kiểm tra chức năng "mới nhất lên đầu".
-- --------------------------------------------------------------------------
INSERT INTO space_types
    (name, description, booking_mode, requires_approval, deleted_at, created_at, updated_at)
VALUES
    ('Phòng học nhóm tiêu chuẩn',
     'Phòng dành cho nhóm từ 4 đến 8 sinh viên học tập và thảo luận.',
     'WHOLE_SPACE', FALSE, NULL, DATE_SUB(NOW(), INTERVAL 7 DAY), NOW()),
    ('Phòng thuyết trình và hội thảo',
     'Phòng có máy chiếu, âm thanh và cần nhân viên duyệt trước khi sử dụng.',
     'WHOLE_SPACE', TRUE, NULL, DATE_SUB(NOW(), INTERVAL 6 DAY), NOW()),
    ('Khu tự học chung',
     'Không gian mở, sinh viên lựa chọn từng ghế khi đặt chỗ.',
     'PER_SEAT', FALSE, NULL, DATE_SUB(NOW(), INTERVAL 5 DAY), NOW()),
    ('Study Booth cá nhân',
     'Khoang học tập yên tĩnh dành cho một hoặc hai sinh viên.',
     'WHOLE_SPACE', FALSE, NULL, DATE_SUB(NOW(), INTERVAL 4 DAY), NOW()),
    ('Phòng thảo luận theo bàn',
     'Phòng được chia thành nhiều bàn nhóm độc lập.',
     'PER_TABLE', FALSE, NULL, DATE_SUB(NOW(), INTERVAL 3 DAY), NOW()),
    ('Phòng sinh hoạt câu lạc bộ',
     'Không gian tổ chức họp và sinh hoạt câu lạc bộ, cần nhân viên duyệt.',
     'WHOLE_SPACE', TRUE, NULL, DATE_SUB(NOW(), INTERVAL 2 DAY), NOW()),
    ('Không gian học tập linh hoạt',
     'Không gian mới có thể đặt theo bàn và cần phê duyệt trước.',
     'PER_TABLE', TRUE, NULL, DATE_SUB(NOW(), INTERVAL 1 DAY), NOW())
ON DUPLICATE KEY UPDATE
    description = VALUES(description),
    booking_mode = VALUES(booking_mode),
    requires_approval = VALUES(requires_approval),
    deleted_at = NULL,
    updated_at = NOW();

SET @type_group := (SELECT id FROM space_types WHERE name = 'Phòng học nhóm tiêu chuẩn' LIMIT 1);
SET @type_presentation := (SELECT id FROM space_types WHERE name = 'Phòng thuyết trình và hội thảo' LIMIT 1);
SET @type_seat := (SELECT id FROM space_types WHERE name = 'Khu tự học chung' LIMIT 1);
SET @type_booth := (SELECT id FROM space_types WHERE name = 'Study Booth cá nhân' LIMIT 1);
SET @type_table := (SELECT id FROM space_types WHERE name = 'Phòng thảo luận theo bàn' LIMIT 1);
SET @type_club := (SELECT id FROM space_types WHERE name = 'Phòng sinh hoạt câu lạc bộ' LIMIT 1);
SET @type_flexible := (SELECT id FROM space_types WHERE name = 'Không gian học tập linh hoạt' LIMIT 1);

-- --------------------------------------------------------------------------
-- 2. Tiện ích
-- --------------------------------------------------------------------------
INSERT INTO facilities
    (name, description, deleted_at, created_at, updated_at)
VALUES
    ('Wi-Fi tốc độ cao', 'Mạng không dây phủ sóng toàn bộ không gian.', NULL, NOW(), NOW()),
    ('Bảng trắng và bút dạ', 'Bảng trắng cỡ lớn kèm bút và dụng cụ lau bảng.', NULL, NOW(), NOW()),
    ('Máy chiếu Full HD', 'Máy chiếu hỗ trợ kết nối HDMI và USB Type-C.', NULL, NOW(), NOW()),
    ('Màn hình TV 65 inch', 'Màn hình thông minh hỗ trợ trình chiếu không dây.', NULL, NOW(), NOW()),
    ('Ổ cắm điện', 'Ổ cắm điện và cổng sạc được bố trí tại khu vực học tập.', NULL, NOW(), NOW()),
    ('Điều hòa không khí', 'Hệ thống điều hòa và thông gió trong phòng.', NULL, NOW(), NOW()),
    ('Camera hội nghị', 'Camera góc rộng phục vụ học và họp trực tuyến.', NULL, NOW(), NOW()),
    ('Hệ thống âm thanh', 'Loa và micro phục vụ thuyết trình, hội thảo.', NULL, NOW(), NOW())
ON DUPLICATE KEY UPDATE
    description = VALUES(description),
    deleted_at = NULL,
    updated_at = NOW();

SET @facility_wifi := (SELECT id FROM facilities WHERE name = 'Wi-Fi tốc độ cao' LIMIT 1);
SET @facility_board := (SELECT id FROM facilities WHERE name = 'Bảng trắng và bút dạ' LIMIT 1);
SET @facility_projector := (SELECT id FROM facilities WHERE name = 'Máy chiếu Full HD' LIMIT 1);
SET @facility_tv := (SELECT id FROM facilities WHERE name = 'Màn hình TV 65 inch' LIMIT 1);
SET @facility_power := (SELECT id FROM facilities WHERE name = 'Ổ cắm điện' LIMIT 1);
SET @facility_air := (SELECT id FROM facilities WHERE name = 'Điều hòa không khí' LIMIT 1);
SET @facility_camera := (SELECT id FROM facilities WHERE name = 'Camera hội nghị' LIMIT 1);
SET @facility_audio := (SELECT id FROM facilities WHERE name = 'Hệ thống âm thanh' LIMIT 1);

-- --------------------------------------------------------------------------
-- 3. Không gian
-- Mã không gian là khóa nhận diện ổn định của dữ liệu mẫu.
-- --------------------------------------------------------------------------
INSERT INTO spaces
    (space_code, name, space_type_id, building, floor, capacity, status,
     description, deleted_at, created_at, updated_at)
VALUES
    ('G-101', 'Phòng học nhóm G-101', @type_group, 'Tòa A', '1', 6, 'AVAILABLE',
     'Phòng học nhóm gần sảnh chính.', NULL, DATE_SUB(NOW(), INTERVAL 7 DAY), NOW()),
    ('G-102', 'Phòng học nhóm G-102', @type_group, 'Tòa A', '1', 8, 'AVAILABLE',
     'Phòng học nhóm có màn hình trình chiếu.', NULL, DATE_SUB(NOW(), INTERVAL 6 DAY), NOW()),
    ('P-201', 'Phòng thuyết trình P-201', @type_presentation, 'Tòa A', '2', 30, 'AVAILABLE',
     'Phòng thuyết trình có sân khấu nhỏ và hệ thống âm thanh.', NULL, DATE_SUB(NOW(), INTERVAL 5 DAY), NOW()),
    ('S-201', 'Khu tự học S-201', @type_seat, 'Tòa B', '2', 12, 'AVAILABLE',
     'Khu tự học yên tĩnh gồm mười hai ghế cá nhân.', NULL, DATE_SUB(NOW(), INTERVAL 4 DAY), NOW()),
    ('B-301', 'Study Booth B-301', @type_booth, 'Tòa B', '3', 2, 'AVAILABLE',
     'Khoang học cá nhân có vách cách âm.', NULL, DATE_SUB(NOW(), INTERVAL 3 DAY), NOW()),
    ('G-103', 'Phòng học nhóm G-103', @type_group, 'Tòa A', '1', 6, 'MAINTENANCE',
     'Phòng đang bảo trì hệ thống điện.', NULL, DATE_SUB(NOW(), INTERVAL 2 DAY), NOW()),
    ('D-201', 'Phòng thảo luận D-201', @type_table, 'Tòa D', '2', 24, 'AVAILABLE',
     'Phòng gồm bốn bàn thảo luận độc lập.', NULL, DATE_SUB(NOW(), INTERVAL 1 DAY), NOW()),
    ('CLB-401', 'Phòng sinh hoạt CLB-401', @type_club, 'Tòa C', '4', 40, 'AVAILABLE',
     'Không gian dành cho hoạt động câu lạc bộ và sự kiện nhỏ.', NULL, NOW(), NOW()),
    ('L-202', 'Không gian linh hoạt L-202', @type_flexible, 'Tòa E', '2', 20, 'INACTIVE',
     'Không gian mới đang trong giai đoạn chuẩn bị đưa vào sử dụng.', NULL, NOW(), NOW())
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    space_type_id = VALUES(space_type_id),
    building = VALUES(building),
    floor = VALUES(floor),
    capacity = VALUES(capacity),
    status = VALUES(status),
    description = VALUES(description),
    deleted_at = NULL,
    updated_at = NOW();

SET @space_g101 := (SELECT id FROM spaces WHERE space_code = 'G-101' LIMIT 1);
SET @space_g102 := (SELECT id FROM spaces WHERE space_code = 'G-102' LIMIT 1);
SET @space_p201 := (SELECT id FROM spaces WHERE space_code = 'P-201' LIMIT 1);
SET @space_s201 := (SELECT id FROM spaces WHERE space_code = 'S-201' LIMIT 1);
SET @space_b301 := (SELECT id FROM spaces WHERE space_code = 'B-301' LIMIT 1);
SET @space_g103 := (SELECT id FROM spaces WHERE space_code = 'G-103' LIMIT 1);
SET @space_d201 := (SELECT id FROM spaces WHERE space_code = 'D-201' LIMIT 1);
SET @space_clb401 := (SELECT id FROM spaces WHERE space_code = 'CLB-401' LIMIT 1);
SET @space_l202 := (SELECT id FROM spaces WHERE space_code = 'L-202' LIMIT 1);

-- --------------------------------------------------------------------------
-- 4. Ghế của không gian đặt theo ghế S-201
-- --------------------------------------------------------------------------
INSERT INTO seats
    (space_id, seat_code, status, description, deleted_at, created_at, updated_at)
VALUES
    (@space_s201, 'S01', 'AVAILABLE', 'Ghế gần cửa sổ', NULL, NOW(), NOW()),
    (@space_s201, 'S02', 'AVAILABLE', 'Ghế gần cửa sổ', NULL, NOW(), NOW()),
    (@space_s201, 'S03', 'AVAILABLE', 'Ghế dãy A', NULL, NOW(), NOW()),
    (@space_s201, 'S04', 'AVAILABLE', 'Ghế dãy A', NULL, NOW(), NOW()),
    (@space_s201, 'S05', 'AVAILABLE', 'Ghế khu vực trung tâm', NULL, NOW(), NOW()),
    (@space_s201, 'S06', 'AVAILABLE', 'Ghế khu vực trung tâm', NULL, NOW(), NOW()),
    (@space_s201, 'S07', 'AVAILABLE', 'Ghế có ổ cắm điện', NULL, NOW(), NOW()),
    (@space_s201, 'S08', 'AVAILABLE', 'Ghế có ổ cắm điện', NULL, NOW(), NOW()),
    (@space_s201, 'S09', 'AVAILABLE', 'Ghế dãy B', NULL, NOW(), NOW()),
    (@space_s201, 'S10', 'AVAILABLE', 'Ghế dãy B', NULL, NOW(), NOW()),
    (@space_s201, 'S11', 'AVAILABLE', 'Ghế cuối phòng', NULL, NOW(), NOW()),
    (@space_s201, 'S12', 'INACTIVE', 'Ghế đang được bảo trì', NULL, NOW(), NOW())
ON DUPLICATE KEY UPDATE
    status = VALUES(status),
    description = VALUES(description),
    deleted_at = NULL,
    updated_at = NOW();

-- --------------------------------------------------------------------------
-- 5. Bàn của các không gian đặt theo bàn
-- --------------------------------------------------------------------------
INSERT INTO space_tables
    (space_id, table_code, capacity, status, description, deleted_at, created_at, updated_at)
VALUES
    (@space_d201, 'T01', 6, 'AVAILABLE', 'Bàn gần cửa sổ', NULL, NOW(), NOW()),
    (@space_d201, 'T02', 6, 'AVAILABLE', 'Bàn gần màn hình', NULL, NOW(), NOW()),
    (@space_d201, 'T03', 6, 'AVAILABLE', 'Bàn khu vực trung tâm', NULL, NOW(), NOW()),
    (@space_d201, 'T04', 6, 'INACTIVE', 'Bàn đang thay ổ cắm điện', NULL, NOW(), NOW()),
    (@space_l202, 'T01', 4, 'AVAILABLE', 'Bàn linh hoạt số 1', NULL, NOW(), NOW()),
    (@space_l202, 'T02', 4, 'AVAILABLE', 'Bàn linh hoạt số 2', NULL, NOW(), NOW()),
    (@space_l202, 'T03', 4, 'AVAILABLE', 'Bàn linh hoạt số 3', NULL, NOW(), NOW()),
    (@space_l202, 'T04', 4, 'AVAILABLE', 'Bàn linh hoạt số 4', NULL, NOW(), NOW()),
    (@space_l202, 'T05', 4, 'AVAILABLE', 'Bàn linh hoạt số 5', NULL, NOW(), NOW())
ON DUPLICATE KEY UPDATE
    capacity = VALUES(capacity),
    status = VALUES(status),
    description = VALUES(description),
    deleted_at = NULL,
    updated_at = NOW();

-- --------------------------------------------------------------------------
-- 6. Liên kết không gian - tiện ích
-- --------------------------------------------------------------------------
INSERT IGNORE INTO space_facilities (space_id, facility_id) VALUES
    (@space_g101, @facility_wifi), (@space_g101, @facility_board),
    (@space_g101, @facility_power), (@space_g101, @facility_air),
    (@space_g102, @facility_wifi), (@space_g102, @facility_board),
    (@space_g102, @facility_tv), (@space_g102, @facility_power), (@space_g102, @facility_air),
    (@space_p201, @facility_wifi), (@space_p201, @facility_projector),
    (@space_p201, @facility_camera), (@space_p201, @facility_audio), (@space_p201, @facility_air),
    (@space_s201, @facility_wifi), (@space_s201, @facility_power), (@space_s201, @facility_air),
    (@space_b301, @facility_wifi), (@space_b301, @facility_power), (@space_b301, @facility_air),
    (@space_g103, @facility_wifi), (@space_g103, @facility_board), (@space_g103, @facility_power),
    (@space_d201, @facility_wifi), (@space_d201, @facility_board),
    (@space_d201, @facility_tv), (@space_d201, @facility_power), (@space_d201, @facility_air),
    (@space_clb401, @facility_wifi), (@space_clb401, @facility_projector),
    (@space_clb401, @facility_camera), (@space_clb401, @facility_audio), (@space_clb401, @facility_air),
    (@space_l202, @facility_wifi), (@space_l202, @facility_tv),
    (@space_l202, @facility_power), (@space_l202, @facility_air);

-- --------------------------------------------------------------------------
-- 7. Hình ảnh không gian
-- Chỉ thêm khi URL chưa tồn tại nên chạy lại không tạo ảnh trùng.
-- --------------------------------------------------------------------------
SET @image_g101 := 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=1200&q=80';
SET @image_g102 := 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80';
SET @image_p201 := 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1200&q=80';
SET @image_s201 := 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80';
SET @image_b301 := 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80';
SET @image_g103 := 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80';
SET @image_d201 := 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80';
SET @image_clb401 := 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80';
SET @image_l202 := 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80';

INSERT INTO space_images (space_id, image_url, is_primary, sort_order, created_at, updated_at)
SELECT @space_g101, @image_g101, TRUE, 0, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM space_images WHERE space_id = @space_g101 AND image_url = @image_g101);
INSERT INTO space_images (space_id, image_url, is_primary, sort_order, created_at, updated_at)
SELECT @space_g102, @image_g102, TRUE, 0, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM space_images WHERE space_id = @space_g102 AND image_url = @image_g102);
INSERT INTO space_images (space_id, image_url, is_primary, sort_order, created_at, updated_at)
SELECT @space_p201, @image_p201, TRUE, 0, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM space_images WHERE space_id = @space_p201 AND image_url = @image_p201);
INSERT INTO space_images (space_id, image_url, is_primary, sort_order, created_at, updated_at)
SELECT @space_s201, @image_s201, TRUE, 0, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM space_images WHERE space_id = @space_s201 AND image_url = @image_s201);
INSERT INTO space_images (space_id, image_url, is_primary, sort_order, created_at, updated_at)
SELECT @space_b301, @image_b301, TRUE, 0, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM space_images WHERE space_id = @space_b301 AND image_url = @image_b301);
INSERT INTO space_images (space_id, image_url, is_primary, sort_order, created_at, updated_at)
SELECT @space_g103, @image_g103, TRUE, 0, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM space_images WHERE space_id = @space_g103 AND image_url = @image_g103);
INSERT INTO space_images (space_id, image_url, is_primary, sort_order, created_at, updated_at)
SELECT @space_d201, @image_d201, TRUE, 0, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM space_images WHERE space_id = @space_d201 AND image_url = @image_d201);
INSERT INTO space_images (space_id, image_url, is_primary, sort_order, created_at, updated_at)
SELECT @space_clb401, @image_clb401, TRUE, 0, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM space_images WHERE space_id = @space_clb401 AND image_url = @image_clb401);
INSERT INTO space_images (space_id, image_url, is_primary, sort_order, created_at, updated_at)
SELECT @space_l202, @image_l202, TRUE, 0, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM space_images WHERE space_id = @space_l202 AND image_url = @image_l202);

COMMIT;

-- Tóm tắt số dòng mẫu sau khi chạy.
SELECT 'space_types' AS table_name, COUNT(*) AS sample_rows
FROM space_types
WHERE id IN (@type_group, @type_presentation, @type_seat, @type_booth,
             @type_table, @type_club, @type_flexible)
UNION ALL
SELECT 'facilities', COUNT(*) FROM facilities
WHERE id IN (@facility_wifi, @facility_board, @facility_projector, @facility_tv,
             @facility_power, @facility_air, @facility_camera, @facility_audio)
UNION ALL
SELECT 'spaces', COUNT(*) FROM spaces
WHERE space_code IN ('G-101', 'G-102', 'P-201', 'S-201', 'B-301',
                     'G-103', 'D-201', 'CLB-401', 'L-202')
UNION ALL
SELECT 'seats', COUNT(*) FROM seats WHERE space_id = @space_s201
UNION ALL
SELECT 'space_tables', COUNT(*) FROM space_tables WHERE space_id IN (@space_d201, @space_l202)
UNION ALL
SELECT 'space_facilities', COUNT(*) FROM space_facilities
WHERE space_id IN (@space_g101, @space_g102, @space_p201, @space_s201,
                   @space_b301, @space_g103, @space_d201, @space_clb401, @space_l202)
UNION ALL
SELECT 'space_images', COUNT(*) FROM space_images
WHERE space_id IN (@space_g101, @space_g102, @space_p201, @space_s201,
                   @space_b301, @space_g103, @space_d201, @space_clb401, @space_l202);
