-- ============================================================================
-- EduSpace - Tài khoản mẫu dùng chung của Khánh Vân
--
-- Mục đích:
--   - Bổ sung các tài khoản sinh viên sau 3 tài khoản nền của DataSeeder
--     (admin, staff, student).
--   - Đồng bộ đủ các cột hồ sơ mới của module Tân:
--     username, dob, user_code, department, class_name.
--   - Có thể chạy lại nhiều lần mà không tạo trùng tài khoản.
--
-- Cách chạy tại thư mục gốc dự án:
--   mysql --default-character-set=utf8mb4 -u eduspace -peduspace eduspace < database/sample_users_khanhvan.sql
--
-- Lưu ý: ID được MySQL tự sinh để không làm hỏng khóa ngoại ở CSDL đã có dữ
-- liệu. Trên CSDL sạch đã có 3 tài khoản nền, các dòng mới sẽ bắt đầu từ ID 4.
-- ============================================================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
USE eduspace;
START TRANSACTION;

-- Dùng cùng mật khẩu với tài khoản student nền (mặc định: 123456).
SET @sample_password := COALESCE(
    (SELECT password FROM users WHERE email = 'student@eduspace.vn' LIMIT 1),
    '$2a$10$XPrJX/BgkfBcGGHJtDVUmefiCIdNdlHBgAg6h3.DPSQbrW1.tK5S2'
);

INSERT INTO users
    (username, email, password, full_name, phone_number, role, is_active,
     dob, user_code, department, class_name)
VALUES
    ('SV002',  'khanhvan@eduspace.vn', @sample_password, 'Nguyễn Khánh Vân', '0988000444', 'STUDENT', b'1', '12/08/2005', 'SV002', 'Khoa Công nghệ thông tin', 'CNTT2'),
    ('SV003',  'anhvu@eduspace.vn',    @sample_password, 'Trần Anh Vũ',      '0988000555', 'STUDENT', b'1', '21/04/2005', 'SV003', 'Khoa Kỹ thuật phần mềm',   'KTPM1'),
    ('SV004',  'student2@eduspace.vn', @sample_password, 'Nguyễn Hoàng Nam', '0988000666', 'STUDENT', b'1', '03/01/2005', 'SV004', 'Khoa Công nghệ thông tin', 'CNTT1'),
    ('sv.anh', 'sv.anh@eduspace.vn',   @sample_password, 'Nguyễn Minh Anh',  '0987654321', 'STUDENT', b'1', '15/03/2005', 'SV005', 'Khoa Công nghệ thông tin', 'CNTT2'),
    ('sv.nam', 'sv.nam@eduspace.vn',   @sample_password, 'Trần Hoàng Nam',   '0987654322', 'STUDENT', b'1', '22/07/2005', 'SV006', 'Khoa Kỹ thuật phần mềm',   'KTPM1'),
    ('sv.ha',  'sv.ha@eduspace.vn',    @sample_password, 'Lê Thu Hà',        '0987654323', 'STUDENT', b'1', '09/11/2005', 'SV007', 'Khoa Hệ thống thông tin',  'HTTT1'),
    ('sv.bao', 'sv.bao@eduspace.vn',   @sample_password, 'Phạm Gia Bảo',     '0987654324', 'STUDENT', b'1', '18/02/2005', 'SV008', 'Khoa Công nghệ thông tin', 'CNTT3'),
    ('sv.chi', 'sv.chi@eduspace.vn',   @sample_password, 'Ngô Quỳnh Chi',    '0987654325', 'STUDENT', b'1', '30/06/2005', 'SV009', 'Khoa Kỹ thuật phần mềm',   'KTPM2')
ON DUPLICATE KEY UPDATE
    username = VALUES(username),
    full_name = VALUES(full_name),
    phone_number = VALUES(phone_number),
    role = VALUES(role),
    is_active = b'1',
    dob = VALUES(dob),
    user_code = VALUES(user_code),
    department = VALUES(department),
    class_name = VALUES(class_name);

COMMIT;

-- Kết quả kiểm tra nhanh sau khi chạy.
SELECT id, username, email, full_name, role, dob, user_code, department, class_name
FROM users
WHERE email IN (
    'khanhvan@eduspace.vn',
    'anhvu@eduspace.vn',
    'student2@eduspace.vn',
    'sv.anh@eduspace.vn',
    'sv.nam@eduspace.vn',
    'sv.ha@eduspace.vn',
    'sv.bao@eduspace.vn',
    'sv.chi@eduspace.vn'
)
ORDER BY id;
