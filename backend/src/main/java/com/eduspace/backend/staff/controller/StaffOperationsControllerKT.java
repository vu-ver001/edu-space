package com.eduspace.backend.staff.controller;

import com.eduspace.backend.booking.dto.response.BookingResponse;
import com.eduspace.backend.staff.dto.request.BookingRejectRequestKT;
import com.eduspace.backend.staff.dto.response.PendingBookingResponseKT;
import com.eduspace.backend.staff.dto.response.StaffAuditLogResponseKT;
import com.eduspace.backend.staff.dto.response.StaffTimelineResponseKT;
import com.eduspace.backend.staff.service.StaffAuditService;
import com.eduspace.backend.staff.service.StaffOperationsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/staff")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
public class StaffOperationsControllerKT {

    private final StaffOperationsService staffOperationsService;
    private final StaffAuditService staffAuditService;

    /**
     * Chức năng 1: Xem Space Timeline kết hợp cả Booking và Maintenance events.
     * GET /api/staff/spaces/{spaceId}/timeline?from={ISO-8601}&to={ISO-8601}
     */
    @GetMapping("/spaces/{spaceId}/timeline")
    public ResponseEntity<StaffTimelineResponseKT> getSpaceTimeline(
            @PathVariable Long spaceId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        return ResponseEntity.ok(staffOperationsService.getSpaceTimeline(spaceId, from, to));
    }

    /**
     * Chức năng 2: Xem danh sách Booking đang chờ duyệt (PENDING_APPROVAL).
     * GET /api/staff/bookings/pending?spaceId={optional}
     */
    @GetMapping("/bookings/pending")
    public ResponseEntity<List<PendingBookingResponseKT>> getPendingBookings(
            @RequestParam(required = false) Long spaceId) {
        return ResponseEntity.ok(staffOperationsService.getPendingBookings(spaceId));
    }

    /**
     * Chức năng 3: Duyệt Booking (PENDING_APPROVAL -> CONFIRMED).
     * POST /api/staff/bookings/{bookingId}/approve
     */
    @PostMapping("/bookings/{bookingId}/approve")
    public ResponseEntity<BookingResponse> approveBooking(@PathVariable Long bookingId) {
        return ResponseEntity.ok(staffOperationsService.approveBooking(bookingId));
    }

    /**
     * Chức năng 4: Từ chối Booking (PENDING_APPROVAL -> REJECTED).
     * POST /api/staff/bookings/{bookingId}/reject
     */
    @PostMapping("/bookings/{bookingId}/reject")
    public ResponseEntity<BookingResponse> rejectBooking(
            @PathVariable Long bookingId,
            @Valid @RequestBody BookingRejectRequestKT request) {
        return ResponseEntity.ok(staffOperationsService.rejectBooking(bookingId, request));
    }

    /**
     * Chức năng 6: Staff hỗ trợ Check-in tại quầy cho sinh viên.
     * POST /api/staff/bookings/{bookingId}/check-in
     */
    @PostMapping("/bookings/{bookingId}/check-in")
    public ResponseEntity<BookingResponse> staffAssistedCheckIn(@PathVariable Long bookingId) {
        return ResponseEntity.ok(staffOperationsService.staffAssistedCheckIn(bookingId));
    }

    /**
     * Chức năng 7: Xem nhật ký kiểm toán thao tác Staff.
     * GET /api/staff/audit-logs?action=...&targetType=...&targetId=...&spaceId=...
     */
    @GetMapping("/audit-logs")
    public ResponseEntity<List<StaffAuditLogResponseKT>> getAuditLogs(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String targetType,
            @RequestParam(required = false) Long targetId,
            @RequestParam(required = false) Long spaceId) {
        return ResponseEntity.ok(staffAuditService.getAuditLogs(action, targetType, targetId, spaceId));
    }
}
