-- ============================================================================
-- EduSpace - Lịch học mẫu dùng chung của Khánh Vân
--
-- Mỗi sinh viên có nhiều môn học; nhiều sinh viên cùng có lịch học riêng.
-- File tìm student_id theo email thay vì ghi cứng ID, nên dùng được trên các
-- máy có giá trị AUTO_INCREMENT khác nhau.
--
-- Chạy file tài khoản trước, sau đó chạy file này tại thư mục gốc dự án:
--   mysql --default-character-set=utf8mb4 -u eduspace -peduspace eduspace < database/sample_users_khanhvan.sql
--   mysql --default-character-set=utf8mb4 -u eduspace -peduspace eduspace < database/sample_student_schedules_khanhvan.sql
--
-- Chỉ xóa/làm mới các lịch có tiền tố [KV-DEMO], không đụng lịch của người khác.
-- ============================================================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
USE eduspace;
START TRANSACTION;

DELETE ss
FROM student_schedules ss
JOIN users u ON u.id = ss.student_id
WHERE ss.course_name LIKE '[KV-DEMO]%'
  AND u.email IN (
      'khanhvan@eduspace.vn',
      'anhvu@eduspace.vn',
      'student2@eduspace.vn',
      'sv.anh@eduspace.vn',
      'sv.nam@eduspace.vn',
      'sv.ha@eduspace.vn',
      'sv.bao@eduspace.vn',
      'sv.chi@eduspace.vn'
  );

INSERT INTO student_schedules
    (student_id, course_name, schedule_date, start_time, end_time, room)
SELECT
    u.id,
    lesson.course_name,
    lesson.schedule_date,
    lesson.start_time,
    lesson.end_time,
    lesson.room
FROM users u
JOIN (
    SELECT 'khanhvan@eduspace.vn' AS email, '[KV-DEMO] Phát triển phần mềm hướng dịch vụ' AS course_name, '2026-09-30' AS schedule_date, '07:30:00' AS start_time, '10:30:00' AS end_time, 'B2-04' AS room
    UNION ALL SELECT 'khanhvan@eduspace.vn', '[KV-DEMO] Quản lý dự án phần mềm',          '2026-10-01', '13:00:00', '16:00:00', 'C1-02'
    UNION ALL SELECT 'khanhvan@eduspace.vn', '[KV-DEMO] Kiến trúc phần mềm',             '2026-10-05', '08:00:00', '11:00:00', 'A3-01'
    UNION ALL SELECT 'khanhvan@eduspace.vn', '[KV-DEMO] Kiểm thử phần mềm nâng cao',     '2026-10-06', '13:30:00', '16:30:00', 'Lab-03'

    UNION ALL SELECT 'anhvu@eduspace.vn', '[KV-DEMO] Cơ sở dữ liệu nâng cao',            '2026-09-30', '13:00:00', '16:00:00', 'C2-01'
    UNION ALL SELECT 'anhvu@eduspace.vn', '[KV-DEMO] Lập trình Web hiện đại',             '2026-10-02', '07:30:00', '10:30:00', 'Lab-02'
    UNION ALL SELECT 'anhvu@eduspace.vn', '[KV-DEMO] Điện toán đám mây',                  '2026-10-05', '13:00:00', '16:00:00', 'B3-05'
    UNION ALL SELECT 'anhvu@eduspace.vn', '[KV-DEMO] An toàn thông tin',                  '2026-10-07', '08:00:00', '11:00:00', 'A2-03'

    UNION ALL SELECT 'student2@eduspace.vn', '[KV-DEMO] Cấu trúc dữ liệu và giải thuật',  '2026-10-01', '07:30:00', '10:30:00', 'A1-05'
    UNION ALL SELECT 'student2@eduspace.vn', '[KV-DEMO] Lập trình ứng dụng di động',       '2026-10-02', '13:00:00', '16:00:00', 'Lab-01'
    UNION ALL SELECT 'student2@eduspace.vn', '[KV-DEMO] Trí tuệ nhân tạo',                 '2026-10-06', '08:00:00', '11:00:00', 'B1-06'
    UNION ALL SELECT 'student2@eduspace.vn', '[KV-DEMO] Thiết kế giao diện người dùng',    '2026-10-08', '13:30:00', '16:30:00', 'D2-02'

    UNION ALL SELECT 'sv.anh@eduspace.vn', '[KV-DEMO] Phân tích thiết kế hệ thống',       '2026-09-30', '08:00:00', '11:00:00', 'B1-08'
    UNION ALL SELECT 'sv.anh@eduspace.vn', '[KV-DEMO] Công nghệ phần mềm',                '2026-10-02', '13:30:00', '16:30:00', 'C3-04'
    UNION ALL SELECT 'sv.anh@eduspace.vn', '[KV-DEMO] Lập trình Java',                    '2026-10-07', '07:30:00', '10:30:00', 'Lab-04'
    UNION ALL SELECT 'sv.anh@eduspace.vn', '[KV-DEMO] Kỹ năng làm việc nhóm',             '2026-10-09', '13:00:00', '15:00:00', 'A4-01'

    UNION ALL SELECT 'sv.nam@eduspace.vn', '[KV-DEMO] Mạng máy tính',                     '2026-10-01', '08:00:00', '11:00:00', 'C1-05'
    UNION ALL SELECT 'sv.nam@eduspace.vn', '[KV-DEMO] Hệ điều hành',                      '2026-10-03', '13:00:00', '16:00:00', 'B2-06'
    UNION ALL SELECT 'sv.nam@eduspace.vn', '[KV-DEMO] DevOps và CI/CD',                   '2026-10-06', '13:30:00', '16:30:00', 'Lab-05'
    UNION ALL SELECT 'sv.nam@eduspace.vn', '[KV-DEMO] Phát triển phần mềm Agile',         '2026-10-08', '07:30:00', '10:30:00', 'D1-03'

    UNION ALL SELECT 'sv.ha@eduspace.vn', '[KV-DEMO] Hệ quản trị cơ sở dữ liệu',          '2026-09-30', '13:00:00', '16:00:00', 'Lab-06'
    UNION ALL SELECT 'sv.ha@eduspace.vn', '[KV-DEMO] Phân tích dữ liệu',                  '2026-10-02', '08:00:00', '11:00:00', 'C2-05'
    UNION ALL SELECT 'sv.ha@eduspace.vn', '[KV-DEMO] Kho dữ liệu và BI',                  '2026-10-05', '13:30:00', '16:30:00', 'B4-02'
    UNION ALL SELECT 'sv.ha@eduspace.vn', '[KV-DEMO] Hệ thống thông tin doanh nghiệp',    '2026-10-09', '07:30:00', '10:30:00', 'A2-06'

    UNION ALL SELECT 'sv.bao@eduspace.vn', '[KV-DEMO] Nhập môn học máy',                  '2026-10-01', '13:00:00', '16:00:00', 'B3-01'
    UNION ALL SELECT 'sv.bao@eduspace.vn', '[KV-DEMO] Xử lý ngôn ngữ tự nhiên',           '2026-10-03', '08:00:00', '11:00:00', 'Lab-07'
    UNION ALL SELECT 'sv.bao@eduspace.vn', '[KV-DEMO] Khai phá dữ liệu',                  '2026-10-07', '13:30:00', '16:30:00', 'C4-03'
    UNION ALL SELECT 'sv.bao@eduspace.vn', '[KV-DEMO] Thị giác máy tính',                 '2026-10-09', '08:00:00', '11:00:00', 'Lab-08'

    UNION ALL SELECT 'sv.chi@eduspace.vn', '[KV-DEMO] Đảm bảo chất lượng phần mềm',       '2026-09-30', '07:30:00', '10:30:00', 'D2-04'
    UNION ALL SELECT 'sv.chi@eduspace.vn', '[KV-DEMO] Tự động hóa kiểm thử',              '2026-10-02', '13:00:00', '16:00:00', 'Lab-09'
    UNION ALL SELECT 'sv.chi@eduspace.vn', '[KV-DEMO] Quản lý cấu hình phần mềm',         '2026-10-06', '08:00:00', '11:00:00', 'C3-06'
    UNION ALL SELECT 'sv.chi@eduspace.vn', '[KV-DEMO] Đồ án chuyên ngành',                '2026-10-08', '13:30:00', '16:30:00', 'A5-01'
) AS lesson ON lesson.email = u.email;

COMMIT;

-- Kết quả mong đợi: 8 sinh viên, mỗi sinh viên 4 môn, tổng cộng 32 lịch học.
SELECT
    u.id AS student_id,
    u.email,
    u.full_name,
    COUNT(*) AS subject_count
FROM student_schedules ss
JOIN users u ON u.id = ss.student_id
WHERE ss.course_name LIKE '[KV-DEMO]%'
GROUP BY u.id, u.email, u.full_name
ORDER BY u.id;

SELECT COUNT(*) AS total_kv_demo_schedules
FROM student_schedules
WHERE course_name LIKE '[KV-DEMO]%';
