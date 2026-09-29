-- Đồng bộ cấu trúc users theo module Auth/User của Lê Minh Tân.
-- Có thể chạy lại nhiều lần; giữ student_id cũ để tương thích dữ liệu lịch sử.

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
USE eduspace;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NULL,
    email VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NULL,
    role VARCHAR(20) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    dob VARCHAR(20) NULL,
    user_code VARCHAR(255) NULL,
    department VARCHAR(100) NULL,
    class_name VARCHAR(255) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_users_email UNIQUE (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @ddl := IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'username'),
    'SELECT 1',
    'ALTER TABLE users ADD COLUMN username VARCHAR(50) NULL'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @ddl := IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'dob'),
    'SELECT 1',
    'ALTER TABLE users ADD COLUMN dob VARCHAR(20) NULL'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @ddl := IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'user_code'),
    'SELECT 1',
    'ALTER TABLE users ADD COLUMN user_code VARCHAR(255) NULL'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @ddl := IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'department'),
    'SELECT 1',
    'ALTER TABLE users ADD COLUMN department VARCHAR(100) NULL'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @ddl := IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'class_name'),
    'SELECT 1',
    'ALTER TABLE users ADD COLUMN class_name VARCHAR(255) NULL'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Chuyển mã sinh viên từ cột cũ sang user_code nếu CSDL cũ còn student_id.
SET @ddl := IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'student_id'),
    'UPDATE users SET user_code = student_id WHERE (user_code IS NULL OR TRIM(user_code) = '''') AND student_id IS NOT NULL AND TRIM(student_id) <> ''''',
    'SELECT 1'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Bổ sung mã ổn định cho dữ liệu sinh viên cũ chưa có mã.
UPDATE users
SET user_code = CONCAT('SV', LPAD(id, 5, '0'))
WHERE role = 'STUDENT' AND (user_code IS NULL OR TRIM(user_code) = '');

-- Đồng bộ quy tắc sinh username của entity User hiện tại.
UPDATE users
SET username = CASE
    WHEN role = 'STUDENT' AND user_code IS NOT NULL AND TRIM(user_code) <> '' THEN TRIM(user_code)
    ELSE SUBSTRING_INDEX(email, '@', 1)
END
WHERE username IS NULL OR TRIM(username) = '';

SET @ddl := IF(
    EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'username' AND non_unique = 0),
    'SELECT 1',
    'ALTER TABLE users ADD CONSTRAINT uq_users_username UNIQUE (username)'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @ddl := IF(
    EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'user_code' AND non_unique = 0),
    'SELECT 1',
    'ALTER TABLE users ADD CONSTRAINT uq_users_user_code UNIQUE (user_code)'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
