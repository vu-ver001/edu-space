-- Demo data for the staff audit-log page. Safe to run more than once.
-- Requires the existing demo STAFF, STUDENT and at least one available space.
-- All generated records are marked [DEMO AUDIT]. No active booking or
-- maintenance block is created.

START TRANSACTION;

SET @demo_now := NOW(6);
SET @demo_staff_id := (SELECT id FROM users WHERE email = 'staff@eduspace.vn' AND role = 'STAFF' LIMIT 1);
SET @demo_student_id := (SELECT id FROM users WHERE email = 'student@eduspace.vn' AND role = 'STUDENT' LIMIT 1);
SET @demo_space_id := (SELECT id FROM spaces WHERE status = 'AVAILABLE' AND deleted_at IS NULL ORDER BY id LIMIT 1);

-- A completed booking that was checked in by the staff member yesterday.
INSERT INTO bookings (
    student_id, space_id, start_time, end_time, participant_count,
    purpose, status, checked_in_at, checked_in_by, created_at, updated_at
)
SELECT
    @demo_student_id, @demo_space_id,
    @demo_now - INTERVAL 25 HOUR, @demo_now - INTERVAL 23 HOUR,
    2, '[DEMO AUDIT] Group study with staff check-in', 'COMPLETED',
    @demo_now - INTERVAL 24 HOUR - INTERVAL 55 MINUTE,
    @demo_staff_id, @demo_now - INTERVAL 2 DAY,
    @demo_now - INTERVAL 23 HOUR
WHERE @demo_staff_id IS NOT NULL
  AND @demo_student_id IS NOT NULL
  AND @demo_space_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM bookings
      WHERE purpose = '[DEMO AUDIT] Group study with staff check-in'
  );

SET @demo_booking_id := (
    SELECT id FROM bookings
    WHERE purpose = '[DEMO AUDIT] Group study with staff check-in'
    ORDER BY id LIMIT 1
);

INSERT INTO booking_audit_logs (
    booking_id, action, performed_by, performed_by_email, performed_at, reason, note
)
SELECT @demo_booking_id, 'CREATE_BOOKING', @demo_student_id,
       'student@eduspace.vn', @demo_now - INTERVAL 2 DAY,
       NULL, '[DEMO AUDIT] Booking created'
WHERE @demo_booking_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM booking_audit_logs
      WHERE booking_id = @demo_booking_id AND note = '[DEMO AUDIT] Booking created'
  );

INSERT INTO booking_audit_logs (
    booking_id, action, performed_by, performed_by_email, performed_at, reason, note
)
SELECT @demo_booking_id, 'CHECK_IN', @demo_staff_id,
       'staff@eduspace.vn', @demo_now - INTERVAL 24 HOUR - INTERVAL 55 MINUTE,
       'Staff-assisted check-in', '[DEMO AUDIT] Staff-assisted check-in'
WHERE @demo_booking_id IS NOT NULL AND @demo_staff_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM booking_audit_logs
      WHERE booking_id = @demo_booking_id AND note = '[DEMO AUDIT] Staff-assisted check-in'
  );

INSERT INTO booking_audit_logs (
    booking_id, action, performed_by, performed_by_email, performed_at, reason, note
)
SELECT @demo_booking_id, 'COMPLETE_TIMEOUT', NULL,
       NULL, @demo_now - INTERVAL 23 HOUR,
       NULL, '[DEMO AUDIT] Booking completed after its end time'
WHERE @demo_booking_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM booking_audit_logs
      WHERE booking_id = @demo_booking_id
        AND note = '[DEMO AUDIT] Booking completed after its end time'
  );

-- A future maintenance window created, edited, then cancelled. Soft-deleted
-- so it does not block availability after this script runs.
INSERT INTO maintenance_blocks (
    space_id, start_time, end_time, reason, created_by,
    created_at, updated_at, deleted_at
)
SELECT @demo_space_id,
       @demo_now + INTERVAL 2 DAY,
       @demo_now + INTERVAL 2 DAY + INTERVAL 2 HOUR,
       '[DEMO AUDIT] Projector inspection (updated)',
       @demo_staff_id,
       @demo_now - INTERVAL 5 HOUR,
       @demo_now - INTERVAL 3 HOUR,
       @demo_now - INTERVAL 3 HOUR
WHERE @demo_staff_id IS NOT NULL AND @demo_space_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM maintenance_blocks
      WHERE reason = '[DEMO AUDIT] Projector inspection (updated)'
  );

SET @demo_maintenance_id := (
    SELECT id FROM maintenance_blocks
    WHERE reason = '[DEMO AUDIT] Projector inspection (updated)'
    ORDER BY id LIMIT 1
);

INSERT INTO staff_audit_logs (
    action, actor_email, actor_user_id, created_at,
    details, space_id, target_id, target_type
)
SELECT 'STAFF_CHECKED_IN_BOOKING', 'staff@eduspace.vn', @demo_staff_id,
       @demo_now - INTERVAL 24 HOUR - INTERVAL 55 MINUTE,
       '[DEMO AUDIT] Staff-assisted check-in at the counter',
       @demo_space_id, @demo_booking_id, 'BOOKING'
WHERE @demo_staff_id IS NOT NULL AND @demo_booking_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM staff_audit_logs
      WHERE action = 'STAFF_CHECKED_IN_BOOKING'
        AND target_type = 'BOOKING' AND target_id = @demo_booking_id
        AND details LIKE '[DEMO AUDIT]%'
  );

INSERT INTO staff_audit_logs (
    action, actor_email, actor_user_id, created_at,
    details, space_id, target_id, target_type
)
SELECT 'MAINTENANCE_CREATED', 'staff@eduspace.vn', @demo_staff_id,
       @demo_now - INTERVAL 5 HOUR,
       '[DEMO AUDIT] Created projector inspection window',
       @demo_space_id, @demo_maintenance_id, 'MAINTENANCE'
WHERE @demo_staff_id IS NOT NULL AND @demo_maintenance_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM staff_audit_logs
      WHERE action = 'MAINTENANCE_CREATED'
        AND target_type = 'MAINTENANCE' AND target_id = @demo_maintenance_id
        AND details LIKE '[DEMO AUDIT]%'
  );

INSERT INTO staff_audit_logs (
    action, actor_email, actor_user_id, created_at,
    details, space_id, target_id, target_type
)
SELECT 'MAINTENANCE_UPDATED', 'staff@eduspace.vn', @demo_staff_id,
       @demo_now - INTERVAL 4 HOUR,
       '[DEMO AUDIT] Extended projector inspection window',
       @demo_space_id, @demo_maintenance_id, 'MAINTENANCE'
WHERE @demo_staff_id IS NOT NULL AND @demo_maintenance_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM staff_audit_logs
      WHERE action = 'MAINTENANCE_UPDATED'
        AND target_type = 'MAINTENANCE' AND target_id = @demo_maintenance_id
        AND details LIKE '[DEMO AUDIT]%'
  );

INSERT INTO staff_audit_logs (
    action, actor_email, actor_user_id, created_at,
    details, space_id, target_id, target_type
)
SELECT 'MAINTENANCE_CANCELLED', 'staff@eduspace.vn', @demo_staff_id,
       @demo_now - INTERVAL 3 HOUR,
       '[DEMO AUDIT] Cancelled projector inspection window',
       @demo_space_id, @demo_maintenance_id, 'MAINTENANCE'
WHERE @demo_staff_id IS NOT NULL AND @demo_maintenance_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM staff_audit_logs
      WHERE action = 'MAINTENANCE_CANCELLED'
        AND target_type = 'MAINTENANCE' AND target_id = @demo_maintenance_id
        AND details LIKE '[DEMO AUDIT]%'
  );

COMMIT;
