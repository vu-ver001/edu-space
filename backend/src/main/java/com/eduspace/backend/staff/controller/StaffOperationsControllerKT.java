package com.eduspace.backend.staff.controller;

import com.eduspace.backend.booking.dto.response.BookingResponse;
import com.eduspace.backend.booking.entity.BookingStatus;
import com.eduspace.backend.staff.dto.request.BookingRejectRequestKT;
import com.eduspace.backend.staff.dto.response.PendingBookingResponseKT;
import com.eduspace.backend.staff.dto.response.StaffAuditLogPageResponseKT;
import com.eduspace.backend.staff.dto.response.StaffAuditStatsResponseKT;
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
@PreAuthorize("hasRole('STAFF')")
public class StaffOperationsControllerKT {

    private final StaffOperationsService staffOperationsService;
    private final StaffAuditService staffAuditService;

    /**
     * Danh sách booking dành cho màn hình quản lý Staff.
     * GET /api/staff/bookings?status={optional}
     */
    @GetMapping("/bookings")
    public ResponseEntity<List<BookingResponse>> getBookings(
            @RequestParam(required = false) BookingStatus status) {
        return ResponseEntity.ok(staffOperationsService.getBookingsForStaff(status));
    }

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
     * GET /api/staff/audit-logs?action=...&targetType=...&targetId=...&spaceId=...&spaceName=...
     *     &actorUserId=...&from=yyyy-MM-dd&to=yyyy-MM-dd&page=0&size=10
     * - Có page/size (hoặc from/to/spaceName/actorUserId) -> trả trang (chuẩn cho AuditLogPage).
     * - Không có -> trả List (tương thích API cũ).
     * - STAFF tự bị scope theo JWT.
     */
    @GetMapping("/audit-logs")
    public ResponseEntity<?> getAuditLogs(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String targetType,
            @RequestParam(required = false) Long targetId,
            @RequestParam(required = false) Long spaceId,
            @RequestParam(required = false) String spaceName,
            @RequestParam(required = false) Long actorUserId,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        boolean paged = page != null || size != null || from != null || to != null
                || spaceName != null || actorUserId != null;
        if (paged) {
            StaffAuditLogPageResponseKT result = staffAuditService.searchAuditLogs(
                    action, targetType, targetId, spaceId, spaceName, actorUserId, from, to, page, size);
            return ResponseEntity.ok(result);
        }
        return ResponseEntity.ok(staffAuditService.getAuditLogs(action, targetType, targetId, spaceId));
    }

    /**
     * Thống kê audit-log cho cards trên AuditLogPage.
     * GET /api/staff/audit-logs/stats?... (cùng bộ lọc như /audit-logs)
     */
    @GetMapping("/audit-logs/stats")
    public ResponseEntity<StaffAuditStatsResponseKT> getAuditStats(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String targetType,
            @RequestParam(required = false) Long targetId,
            @RequestParam(required = false) Long spaceId,
            @RequestParam(required = false) String spaceName,
            @RequestParam(required = false) Long actorUserId,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        return ResponseEntity.ok(staffAuditService.getAuditStats(
                action, targetType, targetId, spaceId, spaceName, actorUserId, from, to));
    }
}
