-- ====================================================================
-- EDU-SPACE SEED DATA — PHẦN NGUYỄN THỊ KIM TUYẾN (CẬP NHẬT)
-- Dữ liệu mẫu kiểm thử cho space_types, spaces, seats, facilities, space_tables, space_facilities
-- ====================================================================

-- 1. Seed: Loại không gian học tập (hỗ trợ WHOLE_SPACE, PER_SEAT, PER_TABLE)
INSERT INTO space_types (id, name, description, booking_mode, requires_approval, created_at, updated_at) VALUES
(1, 'Phòng học nhóm tiêu chuẩn', 'Phòng dành cho 4 - 8 sinh viên tự học, thảo luận nhóm; đặt nguyên phòng', 'WHOLE_SPACE', FALSE, NOW(), NOW()),
(2, 'Phòng thuyết trình & Hội thảo', 'Phòng trang bị máy chiếu, âm thanh; đặt nguyên phòng, bắt buộc Staff duyệt', 'WHOLE_SPACE', TRUE, NOW(), NOW()),
(3, 'Khu tự học chung (Mở)', 'Không gian tự học tập trung nhiều chỗ ngồi; sinh viên đặt theo từng chỗ ngồi (seat)', 'PER_SEAT', FALSE, NOW(), NOW()),
(4, 'Study Booth cá nhân', 'Khoang tự học cách âm độc lập dành cho 1 - 2 sinh viên; đặt nguyên booth', 'WHOLE_SPACE', FALSE, NOW(), NOW()),
(5, 'Phòng thảo luận theo bàn', 'Phòng trang bị bàn nhóm độc lập; sinh viên đặt theo từng bàn (table)', 'PER_TABLE', FALSE, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    name=VALUES(name), 
    description=VALUES(description), 
    booking_mode=VALUES(booking_mode), 
    requires_approval=VALUES(requires_approval),
    updated_at=NOW();

-- 2. Seed: Danh mục tiện ích (facilities)
INSERT INTO facilities (id, name, description, created_at, updated_at) VALUES
(1, 'Bảng trắng & Bút dạ', 'Bảng từ trắng treo tường cỡ lớn kèm bút viết dạ và bông lau', NOW(), NOW()),
(2, 'Máy chiếu Full HD', 'Máy chiếu độ phân giải cao kết nối qua cổng HDMI/Type-C', NOW(), NOW()),
(3, 'Màn hình TV thông minh 65 inch', 'Smart TV hỗ trợ trình chiếu không dây AirPlay/Miracast', NOW(), NOW()),
(4, 'Ổ cắm điện đa năng', 'Hệ thống ổ cắm điện tích hợp cổng sạc USB/Type-C tại mỗi bàn/chỗ', NOW(), NOW()),
(5, 'Điều hòa không khí 2 chiều', 'Hệ thống làm mát và thông gió độc lập', NOW(), NOW())
ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), updated_at=NOW();

-- 3. Seed: Không gian cụ thể (spaces)
INSERT INTO spaces (id, name, space_code, space_type_id, building, floor, capacity, status, description, created_at, updated_at) VALUES
(1, 'Phòng G-101', 'G-101', 1, 'Tòa A', 1, 6, 'AVAILABLE', 'Phòng học nhóm tầng 1, gần sảnh chờ (WHOLE_SPACE)', NOW(), NOW()),
(2, 'Phòng G-102', 'G-102', 1, 'Tòa A', 1, 8, 'AVAILABLE', 'Phòng học nhóm cỡ vừa, trang bị bảng và màn hình lớn (WHOLE_SPACE)', NOW(), NOW()),
(3, 'Phòng P-201', 'P-201', 2, 'Tòa A', 2, 20, 'AVAILABLE', 'Phòng thuyết trình chuyên dụng, cách âm (WHOLE_SPACE)', NOW(), NOW()),
(4, 'Khu tự học S-201', 'S-201', 3, 'Tòa B', 2, 10, 'AVAILABLE', 'Khu tự học chung tầng 2, sức chứa 10 chỗ ngồi độc lập (PER_SEAT)', NOW(), NOW()),
(5, 'Study Booth B-01', 'B-01', 4, 'Tòa B', 3, 2, 'AVAILABLE', 'Khoang tự học yên tĩnh, bàn đôi (WHOLE_SPACE)', NOW(), NOW()),
(6, 'Phòng G-103 (Bảo trì)', 'G-103', 1, 'Tòa A', 1, 6, 'MAINTENANCE', 'Phòng đang cải tạo hệ thống điện, tạm ngừng phục vụ', NOW(), NOW()),
(7, 'Phòng D-201', 'D-201', 5, 'Tòa D', 2, 24, 'AVAILABLE', 'Phòng thảo luận nhóm tầng 2, sức chứa 24 chỗ chia thành 4 bàn (PER_TABLE)', NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    name=VALUES(name), 
    space_code=VALUES(space_code),
    space_type_id=VALUES(space_type_id), 
    building=VALUES(building), 
    floor=VALUES(floor), 
    capacity=VALUES(capacity), 
    status=VALUES(status),
    description=VALUES(description),
    updated_at=NOW();

-- 4. Seed: Chỗ ngồi (seats) cho không gian PER_SEAT (Khu tự học S-201, space_id = 4)
INSERT INTO seats (id, space_id, seat_code, status, description, created_at, updated_at) VALUES
(1, 4, 'S01', 'AVAILABLE', 'Chỗ ngồi gần cửa sổ dãy A', NOW(), NOW()),
(2, 4, 'S02', 'AVAILABLE', 'Chỗ ngồi gần cửa sổ dãy A', NOW(), NOW()),
(3, 4, 'S03', 'AVAILABLE', 'Chỗ ngồi dãy A', NOW(), NOW()),
(4, 4, 'S04', 'AVAILABLE', 'Chỗ ngồi dãy A', NOW(), NOW()),
(5, 4, 'S05', 'AVAILABLE', 'Chỗ ngồi trung tâm có vách ngăn', NOW(), NOW()),
(6, 4, 'S06', 'AVAILABLE', 'Chỗ ngồi trung tâm có vách ngăn', NOW(), NOW()),
(7, 4, 'S07', 'AVAILABLE', 'Chỗ ngồi dãy B gần ổ cắm điện', NOW(), NOW()),
(8, 4, 'S08', 'AVAILABLE', 'Chỗ ngồi dãy B gần ổ cắm điện', NOW(), NOW()),
(9, 4, 'S09', 'AVAILABLE', 'Chỗ ngồi dãy B', NOW(), NOW()),
(10, 4, 'S10', 'INACTIVE', 'Chỗ ngồi đang thay bàn ghế mới (tạm khóa)', NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    space_id=VALUES(space_id), 
    seat_code=VALUES(seat_code), 
    status=VALUES(status), 
    description=VALUES(description),
    updated_at=NOW();

-- 5. Seed: Bàn thảo luận (space_tables) cho không gian PER_TABLE (Phòng D-201, space_id = 7, capacity = 24)
INSERT INTO space_tables (id, space_id, table_code, capacity, status, description, created_at, updated_at) VALUES
(1, 7, 'T01', 6, 'AVAILABLE', 'Bàn 6 chỗ gần cửa sổ dãy A', NOW(), NOW()),
(2, 7, 'T02', 6, 'AVAILABLE', 'Bàn 6 chỗ gần màn hình trình chiếu', NOW(), NOW()),
(3, 7, 'T03', 4, 'AVAILABLE', 'Bàn 4 chỗ góc yên tĩnh', NOW(), NOW()),
(4, 7, 'T04', 8, 'AVAILABLE', 'Bàn lớn 8 chỗ trung tâm phòng', NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    space_id=VALUES(space_id), 
    table_code=VALUES(table_code), 
    capacity=VALUES(capacity), 
    status=VALUES(status), 
    description=VALUES(description),
    updated_at=NOW();

-- 6. Seed: Liên kết phòng - tiện ích (space_facilities)
INSERT INTO space_facilities (space_id, facility_id) VALUES
-- Phòng G-101: Bảng trắng, Ổ cắm, Điều hòa
(1, 1), (1, 4), (1, 5),
-- Phòng G-102: Bảng trắng, Màn hình TV, Ổ cắm, Điều hòa
(2, 1), (2, 3), (2, 4), (2, 5),
-- Phòng P-201: Bảng trắng, Máy chiếu, Màn hình TV, Ổ cắm, Điều hòa
(3, 1), (3, 2), (3, 3), (3, 4), (3, 5),
-- Khu tự học S-201 (PER_SEAT): Ổ cắm điện đa năng, Điều hòa
(4, 4), (4, 5),
-- Study Booth B-01: Ổ cắm, Điều hòa
(5, 4), (5, 5),
-- Phòng D-201 (PER_TABLE): Bảng trắng, Ổ cắm, Điều hòa
(7, 1), (7, 4), (7, 5)
ON DUPLICATE KEY UPDATE space_id=VALUES(space_id), facility_id=VALUES(facility_id);

-- 7. Seed: Danh mục hình ảnh không gian (space_images) - Phân hệ Kim Tuyến
INSERT INTO space_images (id, space_id, image_url, is_primary, sort_order, created_at, updated_at) VALUES
(1, 1, 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=600&auto=format&fit=crop&q=80', TRUE, 0, NOW(), NOW()),
(2, 2, 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format&fit=crop&q=80', TRUE, 0, NOW(), NOW()),
(3, 3, 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=600&auto=format&fit=crop&q=80', TRUE, 0, NOW(), NOW()),
(4, 4, 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&auto=format&fit=crop&q=80', TRUE, 0, NOW(), NOW()),
(11, 4, 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1000&auto=format&fit=crop&q=80', FALSE, 1, NOW(), NOW()),
(12, 4, 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1000&auto=format&fit=crop&q=80', FALSE, 2, NOW(), NOW()),
(13, 4, 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=1000&auto=format&fit=crop&q=80', FALSE, 3, NOW(), NOW()),
(14, 4, 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1000&auto=format&fit=crop&q=80', FALSE, 4, NOW(), NOW()),
(15, 4, 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1000&auto=format&fit=crop&q=80', FALSE, 5, NOW(), NOW()),
(5, 5, 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&auto=format&fit=crop&q=80', TRUE, 0, NOW(), NOW()),
(6, 6, 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80', TRUE, 0, NOW(), NOW()),
(7, 7, 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=600&auto=format&fit=crop&q=80', TRUE, 0, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    space_id=VALUES(space_id),
    image_url=VALUES(image_url),
    is_primary=VALUES(is_primary),
    sort_order=VALUES(sort_order),
    updated_at=NOW();

