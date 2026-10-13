-- More timeline demo data for MySQL eduspace on the active backend port (3306).
-- Adds events for every room today and older bookings in rooms 1-3.
-- Safe to rerun: every booking purpose/reason has a unique [DEMO HISTORY] marker.

START TRANSACTION;
SET @history_now := UTC_TIMESTAMP(6) + INTERVAL 7 HOUR;
SET @history_day := DATE(@history_now);
SET @history_student := (SELECT id FROM users WHERE email = 'student@eduspace.vn' AND role = 'STUDENT' AND is_active = 1 LIMIT 1);
SET @history_staff := (SELECT id FROM users WHERE email = 'staff@eduspace.vn' AND role = 'STAFF' AND is_active = 1 LIMIT 1);
SET @history_room1 := (SELECT id FROM spaces WHERE id = 1 AND deleted_at IS NULL);
SET @history_room2 := (SELECT id FROM spaces WHERE id = 2 AND deleted_at IS NULL);
SET @history_room3 := (SELECT id FROM spaces WHERE id = 3 AND deleted_at IS NULL);
SET @history_room4 := (SELECT id FROM spaces WHERE id = 4 AND deleted_at IS NULL);

-- Three more bookings today; the existing [DEMO LIVE] booking is in room 1 at 10:00.
INSERT INTO bookings (student_id, space_id, start_time, end_time, participant_count, purpose, status, created_at, updated_at)
SELECT @history_student, @history_room1, @history_day + INTERVAL 16 HOUR,
       @history_day + INTERVAL 17 HOUR, 2, '[DEMO HISTORY] Nhom hoc buoi chieu A101',
       'CONFIRMED', @history_now - INTERVAL 1 HOUR, @history_now - INTERVAL 1 HOUR
WHERE @history_student IS NOT NULL AND @history_room1 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM bookings WHERE purpose = '[DEMO HISTORY] Nhom hoc buoi chieu A101');

INSERT INTO bookings (student_id, space_id, start_time, end_time, participant_count, purpose, status, created_at, updated_at)
SELECT @history_student, @history_room2, @history_day + INTERVAL 12 HOUR,
       @history_day + INTERVAL 13 HOUR, 3, '[DEMO HISTORY] Thao luan tai A102 hom nay',
       'CONFIRMED', @history_now - INTERVAL 1 HOUR, @history_now - INTERVAL 1 HOUR
WHERE @history_student IS NOT NULL AND @history_room2 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM bookings WHERE purpose = '[DEMO HISTORY] Thao luan tai A102 hom nay');

INSERT INTO bookings (student_id, space_id, start_time, end_time, participant_count, purpose, status, created_at, updated_at)
SELECT @history_student, @history_room3, @history_day + INTERVAL 11 HOUR,
       @history_day + INTERVAL 12 HOUR, 4, '[DEMO HISTORY] Thuyet trinh tai B201 hom nay',
       'CONFIRMED', @history_now - INTERVAL 1 HOUR, @history_now - INTERVAL 1 HOUR
WHERE @history_student IS NOT NULL AND @history_room3 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM bookings WHERE purpose = '[DEMO HISTORY] Thuyet trinh tai B201 hom nay');

-- Older booking states, visible after selecting their dates in the timeline.
INSERT INTO bookings (student_id, space_id, start_time, end_time, participant_count, purpose,
                      status, checked_in_at, checked_in_by, created_at, updated_at)
SELECT @history_student, @history_room1, @history_day - INTERVAL 2 DAY + INTERVAL 9 HOUR,
       @history_day - INTERVAL 2 DAY + INTERVAL 10 HOUR, 3,
       '[DEMO HISTORY] A101 da hoan thanh', 'COMPLETED',
       @history_day - INTERVAL 2 DAY + INTERVAL 9 HOUR + INTERVAL 5 MINUTE,
       @history_student, @history_day - INTERVAL 3 DAY,
       @history_day - INTERVAL 2 DAY + INTERVAL 10 HOUR
WHERE @history_student IS NOT NULL AND @history_room1 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM bookings WHERE purpose = '[DEMO HISTORY] A101 da hoan thanh');

INSERT INTO bookings (student_id, space_id, start_time, end_time, participant_count, purpose, status, created_at, updated_at)
SELECT @history_student, @history_room1, @history_day - INTERVAL 3 DAY + INTERVAL 11 HOUR,
       @history_day - INTERVAL 3 DAY + INTERVAL 12 HOUR, 2,
       '[DEMO HISTORY] A101 da huy', 'CANCELLED',
       @history_day - INTERVAL 4 DAY, @history_day - INTERVAL 4 DAY + INTERVAL 1 HOUR
WHERE @history_student IS NOT NULL AND @history_room1 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM bookings WHERE purpose = '[DEMO HISTORY] A101 da huy');

INSERT INTO bookings (student_id, space_id, start_time, end_time, participant_count, purpose,
                      status, checked_in_at, checked_in_by, created_at, updated_at)
SELECT @history_student, @history_room2, @history_day - INTERVAL 2 DAY + INTERVAL 14 HOUR,
       @history_day - INTERVAL 2 DAY + INTERVAL 15 HOUR, 2,
       '[DEMO HISTORY] A102 da hoan thanh', 'COMPLETED',
       @history_day - INTERVAL 2 DAY + INTERVAL 14 HOUR + INTERVAL 5 MINUTE,
       @history_student, @history_day - INTERVAL 3 DAY,
       @history_day - INTERVAL 2 DAY + INTERVAL 15 HOUR
WHERE @history_student IS NOT NULL AND @history_room2 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM bookings WHERE purpose = '[DEMO HISTORY] A102 da hoan thanh');

INSERT INTO bookings (student_id, space_id, start_time, end_time, participant_count, purpose, status, created_at, updated_at)
SELECT @history_student, @history_room2, @history_day - INTERVAL 3 DAY + INTERVAL 14 HOUR,
       @history_day - INTERVAL 3 DAY + INTERVAL 15 HOUR, 2,
       '[DEMO HISTORY] A102 vang mat', 'NO_SHOW',
       @history_day - INTERVAL 4 DAY, @history_day - INTERVAL 3 DAY + INTERVAL 14 HOUR + INTERVAL 15 MINUTE
WHERE @history_student IS NOT NULL AND @history_room2 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM bookings WHERE purpose = '[DEMO HISTORY] A102 vang mat');

INSERT INTO bookings (student_id, space_id, start_time, end_time, participant_count, purpose,
                      status, checked_in_at, checked_in_by, created_at, updated_at)
SELECT @history_student, @history_room3, @history_day - INTERVAL 1 DAY + INTERVAL 11 HOUR,
       @history_day - INTERVAL 1 DAY + INTERVAL 12 HOUR, 4,
       '[DEMO HISTORY] B201 da hoan thanh', 'COMPLETED',
       @history_day - INTERVAL 1 DAY + INTERVAL 11 HOUR + INTERVAL 5 MINUTE,
       @history_student, @history_day - INTERVAL 2 DAY,
       @history_day - INTERVAL 1 DAY + INTERVAL 12 HOUR
WHERE @history_student IS NOT NULL AND @history_room3 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM bookings WHERE purpose = '[DEMO HISTORY] B201 da hoan thanh');

INSERT INTO bookings (student_id, space_id, start_time, end_time, participant_count, purpose,
                      status, expired_at, expire_reason, created_at, updated_at)
SELECT @history_student, @history_room3, @history_day - INTERVAL 3 DAY + INTERVAL 16 HOUR,
       @history_day - INTERVAL 3 DAY + INTERVAL 17 HOUR, 2,
       '[DEMO HISTORY] B201 het han', 'EXPIRED',
       @history_day - INTERVAL 3 DAY + INTERVAL 16 HOUR,
       'Approval window expired', @history_day - INTERVAL 4 DAY,
       @history_day - INTERVAL 3 DAY + INTERVAL 16 HOUR
WHERE @history_student IS NOT NULL AND @history_room3 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM bookings WHERE purpose = '[DEMO HISTORY] B201 het han');

-- Room 4 is marked MAINTENANCE, so show maintenance rather than an invalid booking.
INSERT INTO maintenance_blocks (space_id, start_time, end_time, reason, created_by, created_at, updated_at)
SELECT @history_room4, @history_day + INTERVAL 10 HOUR,
       @history_day + INTERVAL 12 HOUR,
       '[DEMO HISTORY] Kiem tra phong ky thuat C301 hom nay',
       @history_staff, @history_now - INTERVAL 1 HOUR, @history_now - INTERVAL 1 HOUR
WHERE @history_staff IS NOT NULL AND @history_room4 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM maintenance_blocks
                  WHERE reason = '[DEMO HISTORY] Kiem tra phong ky thuat C301 hom nay');

-- Each sample booking has a matching creation record and outcome history.
INSERT INTO booking_audit_logs (booking_id, action, performed_by, performed_by_email, performed_at, note)
SELECT b.id, 'CREATE_BOOKING', b.student_id, 'student@eduspace.vn', b.created_at,
       '[DEMO HISTORY] Booking created'
FROM bookings b
WHERE b.purpose LIKE '[DEMO HISTORY]%'
  AND NOT EXISTS (SELECT 1 FROM booking_audit_logs a
                  WHERE a.booking_id = b.id AND a.note = '[DEMO HISTORY] Booking created');

INSERT INTO booking_audit_logs (booking_id, action, performed_by, performed_by_email, performed_at, note)
SELECT b.id, 'CHECK_IN', b.student_id, 'student@eduspace.vn', b.checked_in_at,
       '[DEMO HISTORY] Student checked in'
FROM bookings b
WHERE b.purpose LIKE '[DEMO HISTORY]%' AND b.status = 'COMPLETED'
  AND NOT EXISTS (SELECT 1 FROM booking_audit_logs a
                  WHERE a.booking_id = b.id AND a.note = '[DEMO HISTORY] Student checked in');

INSERT INTO booking_audit_logs (booking_id, action, performed_at, note)
SELECT b.id, 'COMPLETE_TIMEOUT', b.end_time, '[DEMO HISTORY] Booking completed'
FROM bookings b
WHERE b.purpose LIKE '[DEMO HISTORY]%' AND b.status = 'COMPLETED'
  AND NOT EXISTS (SELECT 1 FROM booking_audit_logs a
                  WHERE a.booking_id = b.id AND a.note = '[DEMO HISTORY] Booking completed');

INSERT INTO booking_audit_logs (booking_id, action, performed_by, performed_by_email, performed_at, reason, note)
SELECT b.id, 'CANCEL_BOOKING', b.student_id, 'student@eduspace.vn', b.updated_at,
       'Student cancelled', '[DEMO HISTORY] Booking cancelled'
FROM bookings b
WHERE b.purpose LIKE '[DEMO HISTORY]%' AND b.status = 'CANCELLED'
  AND NOT EXISTS (SELECT 1 FROM booking_audit_logs a
                  WHERE a.booking_id = b.id AND a.note = '[DEMO HISTORY] Booking cancelled');

INSERT INTO booking_audit_logs (booking_id, action, performed_at, note)
SELECT b.id, 'NO_SHOW_TIMEOUT', b.updated_at, '[DEMO HISTORY] No show'
FROM bookings b
WHERE b.purpose LIKE '[DEMO HISTORY]%' AND b.status = 'NO_SHOW'
  AND NOT EXISTS (SELECT 1 FROM booking_audit_logs a
                  WHERE a.booking_id = b.id AND a.note = '[DEMO HISTORY] No show');

INSERT INTO booking_audit_logs (booking_id, action, performed_at, note)
SELECT b.id, 'EXPIRE_TIMEOUT', b.expired_at, '[DEMO HISTORY] Approval expired'
FROM bookings b
WHERE b.purpose LIKE '[DEMO HISTORY]%' AND b.status = 'EXPIRED'
  AND NOT EXISTS (SELECT 1 FROM booking_audit_logs a
                  WHERE a.booking_id = b.id AND a.note = '[DEMO HISTORY] Approval expired');

INSERT INTO staff_audit_logs (action, actor_email, actor_user_id, created_at,
                              details, space_id, target_id, target_type)
SELECT 'MAINTENANCE_CREATED', 'staff@eduspace.vn', @history_staff,
       m.created_at, '[DEMO HISTORY] Created technical room maintenance',
       m.space_id, m.id, 'MAINTENANCE'
FROM maintenance_blocks m
WHERE m.reason = '[DEMO HISTORY] Kiem tra phong ky thuat C301 hom nay'
  AND @history_staff IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM staff_audit_logs a
                  WHERE a.action = 'MAINTENANCE_CREATED' AND a.target_id = m.id
                    AND a.details = '[DEMO HISTORY] Created technical room maintenance');

COMMIT;
