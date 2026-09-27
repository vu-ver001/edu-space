package com.eduspace.backend.booking.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

import com.eduspace.backend.booking.dto.request.BulkApproveBookingRequest;
import com.eduspace.backend.booking.dto.request.BulkRejectBookingRequest;
import com.eduspace.backend.booking.dto.request.CreateBookingRequest;
import com.eduspace.backend.booking.dto.request.RejectBookingRequest;
import com.eduspace.backend.booking.dto.response.BookingAuditLogResponse;
import com.eduspace.backend.booking.dto.response.BookingResponse;
import com.eduspace.backend.booking.dto.response.BulkBookingOperationResponse;
import com.eduspace.backend.booking.entity.BookingStatus;
import com.eduspace.backend.booking.service.BookingService;
import com.eduspace.backend.auth.security.SecurityUtils;
import com.eduspace.backend.common.exception.BusinessException;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    /**
     * Tạo yêu cầu đặt chỗ mới (Chỉ dành cho Sinh viên):
     * POST /api/bookings
     */
    @PostMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<BookingResponse> createBooking(@Valid @RequestBody CreateBookingRequest request) {
        String currentUserEmail = resolveCurrentUserEmail();
        BookingResponse response = bookingService.createBooking(request, currentUserEmail);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Xem danh sách booking của tôi (Chỉ dành cho Sinh viên):
     * GET /api/bookings/my-bookings hoặc GET /api/bookings/my
     */
    @GetMapping({"/my-bookings", "/my"})
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<BookingResponse>> getMyBookings(
            @RequestParam(required = false) BookingStatus status) {
        String currentUserEmail = resolveCurrentUserEmail();
        return ResponseEntity.ok(bookingService.getMyBookings(currentUserEmail, status));
    }

    /**
     * Xem chi tiết một booking:
     * GET /api/bookings/{id}
     */
    @GetMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('STUDENT', 'STAFF', 'ADMIN')")
    public ResponseEntity<BookingResponse> getBookingById(@PathVariable Long id) {
        String currentUserEmail = resolveCurrentUserEmail();
        return ResponseEntity.ok(bookingService.getBookingById(id, currentUserEmail));
    }

    /**
     * Xem lịch sử thao tác của booking:
     * GET /api/bookings/{id}/history
     */
    @GetMapping({"/{id}/history"})
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('STUDENT', 'STAFF', 'ADMIN')")
    public ResponseEntity<List<BookingAuditLogResponse>> getBookingAuditLogs(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.getBookingAuditLogs(id));
    }

    /**
     * Hủy booking (Sinh viên sở hữu đơn hoặc Staff/Admin):
     * POST /api/bookings/{id}/cancel
     */
    @PostMapping("/{id}/cancel")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('STUDENT', 'STAFF', 'ADMIN')")
    public ResponseEntity<BookingResponse> cancelBooking(
            @PathVariable Long id,
            @RequestParam(required = false) String reason) {
        String currentUserEmail = resolveCurrentUserEmail();
        return ResponseEntity.ok(bookingService.cancelBooking(id, currentUserEmail, reason));
    }

    /**
     * Duyệt booking (Staff):
     * POST /api/bookings/{id}/approve
     */
    @PostMapping("/{id}/approve")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<BookingResponse> approveBooking(@PathVariable Long id) {
        String currentUserEmail = resolveCurrentUserEmail();
        return ResponseEntity.ok(bookingService.approveBooking(id, currentUserEmail));
    }

    /**
     * Từ chối booking (Staff bắt buộc nhập lý do):
     * POST /api/bookings/{id}/reject
     */
    @PostMapping("/{id}/reject")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<BookingResponse> rejectBooking(
            @PathVariable Long id,
            @Valid @RequestBody RejectBookingRequest request) {
        String currentUserEmail = resolveCurrentUserEmail();
        return ResponseEntity.ok(bookingService.rejectBooking(id, currentUserEmail, request.getRejectReason()));
    }

    /**
     * Duyệt booking hàng loạt (Staff/Admin):
     * POST /api/bookings/bulk-approve
     */
    @PostMapping("/bulk-approve")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<BulkBookingOperationResponse> bulkApproveBookings(
            @Valid @RequestBody BulkApproveBookingRequest request) {
        String currentUserEmail = resolveCurrentUserEmail();
        return ResponseEntity.ok(bookingService.bulkApproveBookings(request.getBookingIds(), currentUserEmail));
    }

    /**
     * Từ chối booking hàng loạt (Staff/Admin bắt buộc nhập lý do):
     * POST /api/bookings/bulk-reject
     */
    @PostMapping("/bulk-reject")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<BulkBookingOperationResponse> bulkRejectBookings(
            @Valid @RequestBody BulkRejectBookingRequest request) {
        String currentUserEmail = resolveCurrentUserEmail();
        return ResponseEntity.ok(bookingService.bulkRejectBookings(
                request.getBookingIds(), currentUserEmail, request.getRejectReason()));
    }

    /**
     * Lấy danh sách booking đang chờ duyệt (cho Staff review):
     * GET /api/bookings/pending
     */
    @GetMapping("/pending")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<List<BookingResponse>> getPendingBookings() {
        return ResponseEntity.ok(bookingService.getPendingBookingsForStaff());
    }

    private String resolveCurrentUserEmail() {
        org.springframework.security.core.Authentication authentication =
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            Object principal = authentication.getPrincipal();
            if (principal instanceof org.springframework.security.core.userdetails.UserDetails) {
                return ((org.springframework.security.core.userdetails.UserDetails) principal).getUsername();
            }
            if (principal instanceof String && !"anonymousUser".equalsIgnoreCase((String) principal)) {
                return (String) principal;
            }
        }
        String authEmail = SecurityUtils.getCurrentUserEmail();
        if (authEmail != null && !authEmail.isBlank() && !"anonymousUser".equalsIgnoreCase(authEmail)) {
            return authEmail;
        }
        throw new BusinessException("UNAUTHENTICATED", "Bạn cần đăng nhập.", HttpStatus.UNAUTHORIZED);
    }
}
