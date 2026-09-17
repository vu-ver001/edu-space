package com.eduspace.backend.checkin.service;

import com.eduspace.backend.auth.entity.Role;
import com.eduspace.backend.auth.entity.User;
import com.eduspace.backend.auth.repository.UserRepository;
import com.eduspace.backend.auth.security.SecurityUtils;
import com.eduspace.backend.booking.dto.response.BookingResponse;
import com.eduspace.backend.booking.entity.AuditAction;
import com.eduspace.backend.booking.entity.Booking;
import com.eduspace.backend.booking.entity.BookingAuditLog;
import com.eduspace.backend.booking.entity.BookingStatus;
import com.eduspace.backend.booking.repository.BookingAuditLogRepository;
import com.eduspace.backend.booking.repository.BookingRepository;
import com.eduspace.backend.booking.service.AvailabilityService;
import com.eduspace.backend.booking.service.BookingService;
import com.eduspace.backend.common.exception.BusinessException;
import java.time.Clock;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Shared manual check-in use case for Student and Staff/Admin assistance. */
@Service
@RequiredArgsConstructor
public class CheckInService {

    private final BookingRepository bookingRepository;
    private final BookingAuditLogRepository auditLogRepository;
    private final AvailabilityService availabilityService;
    private final UserRepository userRepository;
    private final Clock checkInClock;
    private final BookingService bookingService;

    @Transactional
    public BookingResponse checkIn(Long id) {
        String email = SecurityUtils.getCurrentUserEmail();
        if (email == null || "anonymousUser".equals(email)) {
            throw new BusinessException("UNAUTHENTICATED", "Bạn cần đăng nhập.", HttpStatus.UNAUTHORIZED);
        }

        User actor = userRepository.findByEmail(email)
                .filter(User::isActive)
                .orElseThrow(() -> new BusinessException("UNAUTHENTICATED", "Tài khoản không khả dụng.",
                        HttpStatus.UNAUTHORIZED));
        Role role = actor.getRole();
        if (role != Role.STUDENT && role != Role.STAFF && role != Role.ADMIN) {
            throw BusinessException.forbidden("CHECKIN_FORBIDDEN", "Bạn không có quyền check-in.");
        }

        // Read and lock first so concurrent check-in/cancel/timeout requests serialize.
        Booking booking = bookingRepository.findByIdForUpdate(id)
                .orElseThrow(() -> BusinessException.notFound("BOOKING_NOT_FOUND", "Không tìm thấy booking."));
        if (role == Role.STUDENT && !actor.getId().equals(booking.getStudentId())) {
            throw BusinessException.forbidden("CHECKIN_FORBIDDEN", "Bạn chỉ được check-in booking của mình.");
        }
        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw BusinessException.badRequest("INVALID_STATUS_FOR_CHECKIN", "Booking phải ở trạng thái CONFIRMED.");
        }

        long openMinutes = availabilityService.getPolicyLong("CHECKIN_OPEN_MINUTES", 15L);
        long graceMinutes = availabilityService.getPolicyLong("CHECKIN_GRACE_MINUTES", 15L);
        if (openMinutes < 0 || graceMinutes < 0) {
            throw new BusinessException("INVALID_CHECKIN_POLICY", "Cấu hình thời gian check-in không hợp lệ.",
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }

        LocalDateTime now = LocalDateTime.now(checkInClock);
        if (now.isBefore(booking.getStartTime().minusMinutes(openMinutes))) {
            throw BusinessException.badRequest("CHECKIN_TOO_EARLY", "Chưa đến thời gian check-in.");
        }
        if (now.isAfter(booking.getStartTime().plusMinutes(graceMinutes))) {
            throw BusinessException.badRequest("CHECKIN_WINDOW_EXPIRED", "Đã quá thời hạn check-in.");
        }

        booking.setStatus(BookingStatus.CHECKED_IN);
        booking.setCheckedInAt(now);
        booking.setCheckedInBy(actor.getId());
        bookingRepository.save(booking);
        auditLogRepository.save(BookingAuditLog.builder()
                .bookingId(booking.getId())
                .action(AuditAction.CHECK_IN)
                .performedBy(actor.getId())
                .performedByEmail(actor.getEmail())
                .performedAt(now)
                .reason("Xác nhận có mặt sử dụng phòng")
                .note("Check-in thành công")
                .build());
        return bookingService.toBookingResponse(booking, now);
    }
}
