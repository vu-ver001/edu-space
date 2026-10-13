-- Demo data for the eduspace database used by the running backend.
-- Current application.yml points to MySQL port 3306. Run with mysql --database=eduspace.
-- Safe to run again: [DEMO LIVE] markers prevent duplicate records.
-- The application stores LocalDateTime in Asia/Bangkok time. Build sample
-- timestamps from UTC+7 explicitly so the script works with either server timezone.

START TRANSACTION;
SET @demo_now := UTC_TIMESTAMP(6) + INTERVAL 7 HOUR;
SET @demo_day := DATE(@demo_now);
SET @demo_staff := (SELECT id FROM users WHERE email = 'staff@eduspace.vn' AND role = 'STAFF' AND is_active = 1 LIMIT 1);
SET @demo_student := (SELECT id FROM users WHERE email = 'student@eduspace.vn' AND role = 'STUDENT' AND is_active = 1 LIMIT 1);
SET @demo_room1 := (SELECT id FROM spaces WHERE id = 1 AND status = 'AVAILABLE' AND deleted_at IS NULL);
SET @demo_room2 := (SELECT id FROM spaces WHERE id = 2 AND status = 'AVAILABLE' AND deleted_at IS NULL);
SET @demo_room3 := (SELECT id FROM spaces WHERE id = 3 AND status = 'AVAILABLE' AND deleted_at IS NULL);

-- Visible on today's default timeline for the first room.
INSERT INTO bookings (student_id, space_id, start_time, end_time, participant_count,
                      purpose, status, created_at, updated_at)
SELECT @demo_student, @demo_room1,
       @demo_day + INTERVAL 10 HOUR, @demo_day + INTERVAL 11 HOUR,
       3, '[DEMO LIVE] Hoc nhom hom nay', 'CONFIRMED',
       @demo_now - INTERVAL 1 HOUR, @demo_now - INTERVAL 1 HOUR
WHERE @demo_student IS NOT NULL AND @demo_room1 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM bookings WHERE purpose = '[DEMO LIVE] Hoc nhom hom nay');

-- A pending request for the Staff approval tab.
INSERT INTO bookings (student_id, space_id, start_time, end_time, participant_count,
                      purpose, status, created_at, updated_at)
SELECT @demo_student, @demo_room1,
       @demo_day + INTERVAL 1 DAY + INTERVAL 10 HOUR,
       @demo_day + INTERVAL 1 DAY + INTERVAL 11 HOUR,
       2, '[DEMO LIVE] Cho duyet ngay mai', 'PENDING_APPROVAL',
       @demo_now - INTERVAL 30 MINUTE, @demo_now - INTERVAL 30 MINUTE
WHERE @demo_student IS NOT NULL AND @demo_room1 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM bookings WHERE purpose = '[DEMO LIVE] Cho duyet ngay mai');

-- Completed yesterday, checked in by Staff. This is historical and does not occupy a room.
INSERT INTO bookings (student_id, space_id, start_time, end_time, participant_count,
                      purpose, status, checked_in_at, checked_in_by, created_at, updated_at)
SELECT @demo_student, @demo_room2,
       @demo_day - INTERVAL 1 DAY + INTERVAL 10 HOUR,
       @demo_day - INTERVAL 1 DAY + INTERVAL 11 HOUR,
       2, '[DEMO LIVE] Staff check-in hom qua', 'COMPLETED',
       @demo_day - INTERVAL 1 DAY + INTERVAL 10 HOUR + INTERVAL 5 MINUTE,
       @demo_staff, @demo_day - INTERVAL 1 DAY + INTERVAL 8 HOUR,
       @demo_day - INTERVAL 1 DAY + INTERVAL 11 HOUR
WHERE @demo_student IS NOT NULL AND @demo_staff IS NOT NULL AND @demo_room2 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM bookings WHERE purpose = '[DEMO LIVE] Staff check-in hom qua');

-- One approved and one rejected historical Staff decision, both scheduled tomorrow.
INSERT INTO bookings (student_id, space_id, start_time, end_time, participant_count,
                      purpose, status, created_at, updated_at)
SELECT @demo_student, @demo_room2,
       @demo_day + INTERVAL 1 DAY + INTERVAL 10 HOUR,
       @demo_day + INTERVAL 1 DAY + INTERVAL 11 HOUR,
       2, '[DEMO LIVE] Staff da duyet', 'CONFIRMED',
       @demo_now - INTERVAL 4 HOUR, @demo_now - INTERVAL 3 HOUR
WHERE @demo_student IS NOT NULL AND @demo_staff IS NOT NULL AND @demo_room2 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM bookings WHERE purpose = '[DEMO LIVE] Staff da duyet');

INSERT INTO bookings (student_id, space_id, start_time, end_time, participant_count,
                      purpose, status, rejected_at, rejected_by, reject_reason, created_at, updated_at)
SELECT @demo_student, @demo_room3,
       @demo_day + INTERVAL 1 DAY + INTERVAL 10 HOUR,
       @demo_day + INTERVAL 1 DAY + INTERVAL 11 HOUR,
       2, '[DEMO LIVE] Staff da tu choi', 'REJECTED',
       @demo_now - INTERVAL 2 HOUR, @demo_staff,
       '[DEMO LIVE] Khong du dieu kien su dung phong',
       @demo_now - INTERVAL 4 HOUR, @demo_now - INTERVAL 2 HOUR
WHERE @demo_student IS NOT NULL AND @demo_staff IS NOT NULL AND @demo_room3 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM bookings WHERE purpose = '[DEMO LIVE] Staff da tu choi');

SET @demo_today_booking := (SELECT id FROM bookings WHERE purpose = '[DEMO LIVE] Hoc nhom hom nay' ORDER BY id LIMIT 1);
SET @demo_pending_booking := (SELECT id FROM bookings WHERE purpose = '[DEMO LIVE] Cho duyet ngay mai' ORDER BY id LIMIT 1);
SET @demo_checked_booking := (SELECT id FROM bookings WHERE purpose = '[DEMO LIVE] Staff check-in hom qua' ORDER BY id LIMIT 1);
SET @demo_approved_booking := (SELECT id FROM bookings WHERE purpose = '[DEMO LIVE] Staff da duyet' ORDER BY id LIMIT 1);
SET @demo_rejected_booking := (SELECT id FROM bookings WHERE purpose = '[DEMO LIVE] Staff da tu choi' ORDER BY id LIMIT 1);

-- Active maintenance event on today's timeline, after the demo booking.
INSERT INTO maintenance_blocks (space_id, start_time, end_time, reason,
                                created_by, created_at, updated_at)
SELECT @demo_room1,
       @demo_day + INTERVAL 14 HOUR, @demo_day + INTERVAL 15 HOUR,
       '[DEMO LIVE] Kiem tra may chieu hom nay', @demo_staff,
       @demo_now - INTERVAL 30 MINUTE, @demo_now - INTERVAL 30 MINUTE
WHERE @demo_staff IS NOT NULL AND @demo_room1 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM maintenance_blocks
                  WHERE reason = '[DEMO LIVE] Kiem tra may chieu hom nay');

-- Soft-deleted maintenance event to demonstrate update/cancel audit without blocking availability.
INSERT INTO maintenance_blocks (space_id, start_time, end_time, reason,
                                created_by, created_at, updated_at, deleted_at)
SELECT @demo_room3,
       @demo_day + INTERVAL 1 DAY + INTERVAL 14 HOUR,
       @demo_day + INTERVAL 1 DAY + INTERVAL 15 HOUR,
       '[DEMO LIVE] Bao tri da huy', @demo_staff,
       @demo_now - INTERVAL 3 HOUR, @demo_now - INTERVAL 1 HOUR,
       @demo_now - INTERVAL 1 HOUR
WHERE @demo_staff IS NOT NULL AND @demo_room3 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM maintenance_blocks
                  WHERE reason = '[DEMO LIVE] Bao tri da huy');

SET @demo_active_maintenance := (SELECT id FROM maintenance_blocks WHERE reason = '[DEMO LIVE] Kiem tra may chieu hom nay' ORDER BY id LIMIT 1);
SET @demo_cancelled_maintenance := (SELECT id FROM maintenance_blocks WHERE reason = '[DEMO LIVE] Bao tri da huy' ORDER BY id LIMIT 1);

-- Booking event history for every demo booking.
INSERT INTO booking_audit_logs (booking_id, action, performed_by, performed_by_email,
                                performed_at, reason, note)
SELECT b.id, 'CREATE_BOOKING', b.student_id, 'student@eduspace.vn',
       b.created_at, NULL, '[DEMO LIVE] Booking created'
FROM bookings b
WHERE b.purpose LIKE '[DEMO LIVE]%'
  AND NOT EXISTS (SELECT 1 FROM booking_audit_logs a
                  WHERE a.booking_id = b.id AND a.note = '[DEMO LIVE] Booking created');

INSERT INTO booking_audit_logs (booking_id, action, performed_by, performed_by_email,
                                performed_at, reason, note)
SELECT @demo_approved_booking, 'APPROVE_BOOKING', @demo_staff, 'staff@eduspace.vn',
       @demo_now - INTERVAL 3 HOUR, 'Staff approved', '[DEMO LIVE] Staff approved booking'
WHERE @demo_approved_booking IS NOT NULL AND @demo_staff IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM booking_audit_logs WHERE booking_id = @demo_approved_booking
                  AND note = '[DEMO LIVE] Staff approved booking');

INSERT INTO booking_audit_logs (booking_id, action, performed_by, performed_by_email,
                                performed_at, reason, note)
SELECT @demo_rejected_booking, 'REJECT_BOOKING', @demo_staff, 'staff@eduspace.vn',
       @demo_now - INTERVAL 2 HOUR, 'Khong du dieu kien', '[DEMO LIVE] Staff rejected booking'
WHERE @demo_rejected_booking IS NOT NULL AND @demo_staff IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM booking_audit_logs WHERE booking_id = @demo_rejected_booking
                  AND note = '[DEMO LIVE] Staff rejected booking');

INSERT INTO booking_audit_logs (booking_id, action, performed_by, performed_by_email,
                                performed_at, reason, note)
SELECT @demo_checked_booking, 'CHECK_IN', @demo_staff, 'staff@eduspace.vn',
       @demo_day - INTERVAL 1 DAY + INTERVAL 10 HOUR + INTERVAL 5 MINUTE,
       'Staff-assisted check-in', '[DEMO LIVE] Staff checked in booking'
WHERE @demo_checked_booking IS NOT NULL AND @demo_staff IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM booking_audit_logs WHERE booking_id = @demo_checked_booking
                  AND note = '[DEMO LIVE] Staff checked in booking');

INSERT INTO booking_audit_logs (booking_id, action, performed_at, note)
SELECT @demo_checked_booking, 'COMPLETE_TIMEOUT',
       @demo_day - INTERVAL 1 DAY + INTERVAL 11 HOUR,
       '[DEMO LIVE] Booking completed'
WHERE @demo_checked_booking IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM booking_audit_logs WHERE booking_id = @demo_checked_booking
                  AND note = '[DEMO LIVE] Booking completed');

-- Staff audit: all six action types visible under the default last-30-days filter.
INSERT INTO staff_audit_logs (action, actor_email, actor_user_id, created_at,
                              details, space_id, target_id, target_type)
SELECT 'BOOKING_APPROVED', 'staff@eduspace.vn', @demo_staff,
       @demo_now - INTERVAL 3 HOUR, '[DEMO LIVE] Approved booking',
       @demo_room2, @demo_approved_booking, 'BOOKING'
WHERE @demo_staff IS NOT NULL AND @demo_approved_booking IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM staff_audit_logs WHERE action = 'BOOKING_APPROVED'
                  AND target_id = @demo_approved_booking AND details LIKE '[DEMO LIVE]%');

INSERT INTO staff_audit_logs (action, actor_email, actor_user_id, created_at,
                              details, space_id, target_id, target_type)
SELECT 'BOOKING_REJECTED', 'staff@eduspace.vn', @demo_staff,
       @demo_now - INTERVAL 2 HOUR, '[DEMO LIVE] Rejected booking: Khong du dieu kien',
       @demo_room3, @demo_rejected_booking, 'BOOKING'
WHERE @demo_staff IS NOT NULL AND @demo_rejected_booking IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM staff_audit_logs WHERE action = 'BOOKING_REJECTED'
                  AND target_id = @demo_rejected_booking AND details LIKE '[DEMO LIVE]%');

INSERT INTO staff_audit_logs (action, actor_email, actor_user_id, created_at,
                              details, space_id, target_id, target_type)
SELECT 'STAFF_CHECKED_IN_BOOKING', 'staff@eduspace.vn', @demo_staff,
       @demo_day - INTERVAL 1 DAY + INTERVAL 10 HOUR + INTERVAL 5 MINUTE,
       '[DEMO LIVE] Staff-assisted check-in', @demo_room2, @demo_checked_booking, 'BOOKING'
WHERE @demo_staff IS NOT NULL AND @demo_checked_booking IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM staff_audit_logs WHERE action = 'STAFF_CHECKED_IN_BOOKING'
                  AND target_id = @demo_checked_booking AND details LIKE '[DEMO LIVE]%');

INSERT INTO staff_audit_logs (action, actor_email, actor_user_id, created_at,
                              details, space_id, target_id, target_type)
SELECT 'MAINTENANCE_CREATED', 'staff@eduspace.vn', @demo_staff,
       @demo_now - INTERVAL 30 MINUTE, '[DEMO LIVE] Created today projector inspection',
       @demo_room1, @demo_active_maintenance, 'MAINTENANCE'
WHERE @demo_staff IS NOT NULL AND @demo_active_maintenance IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM staff_audit_logs WHERE action = 'MAINTENANCE_CREATED'
                  AND target_id = @demo_active_maintenance AND details LIKE '[DEMO LIVE]%');

INSERT INTO staff_audit_logs (action, actor_email, actor_user_id, created_at,
                              details, space_id, target_id, target_type)
SELECT 'MAINTENANCE_CREATED', 'staff@eduspace.vn', @demo_staff,
       @demo_now - INTERVAL 3 HOUR, '[DEMO LIVE] Created maintenance later cancelled',
       @demo_room3, @demo_cancelled_maintenance, 'MAINTENANCE'
WHERE @demo_staff IS NOT NULL AND @demo_cancelled_maintenance IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM staff_audit_logs WHERE action = 'MAINTENANCE_CREATED'
                  AND target_id = @demo_cancelled_maintenance AND details LIKE '[DEMO LIVE]%');

INSERT INTO staff_audit_logs (action, actor_email, actor_user_id, created_at,
                              details, space_id, target_id, target_type)
SELECT 'MAINTENANCE_UPDATED', 'staff@eduspace.vn', @demo_staff,
       @demo_now - INTERVAL 2 HOUR, '[DEMO LIVE] Updated maintenance window',
       @demo_room3, @demo_cancelled_maintenance, 'MAINTENANCE'
WHERE @demo_staff IS NOT NULL AND @demo_cancelled_maintenance IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM staff_audit_logs WHERE action = 'MAINTENANCE_UPDATED'
                  AND target_id = @demo_cancelled_maintenance AND details LIKE '[DEMO LIVE]%');

INSERT INTO staff_audit_logs (action, actor_email, actor_user_id, created_at,
                              details, space_id, target_id, target_type)
SELECT 'MAINTENANCE_CANCELLED', 'staff@eduspace.vn', @demo_staff,
       @demo_now - INTERVAL 1 HOUR, '[DEMO LIVE] Cancelled maintenance window',
       @demo_room3, @demo_cancelled_maintenance, 'MAINTENANCE'
WHERE @demo_staff IS NOT NULL AND @demo_cancelled_maintenance IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM staff_audit_logs WHERE action = 'MAINTENANCE_CANCELLED'
                  AND target_id = @demo_cancelled_maintenance AND details LIKE '[DEMO LIVE]%');

COMMIT;
