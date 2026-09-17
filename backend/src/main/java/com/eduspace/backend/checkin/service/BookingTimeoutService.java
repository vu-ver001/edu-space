package com.eduspace.backend.checkin.service;

import com.eduspace.backend.booking.entity.*;
import com.eduspace.backend.booking.repository.*;
import com.eduspace.backend.checkin.policy.service.PolicyService;
import java.time.Clock;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BookingTimeoutService {
    private final BookingRepository bookings;
    private final BookingAuditLogRepository audits;
    private final PolicyService policies;
    private final Clock checkInClock;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean markNoShow(Long id) {
        var booking = bookings.findByIdForUpdate(id).orElse(null);
        if (booking == null || booking.getStatus() != BookingStatus.CONFIRMED) return false;
        long grace = policies.getLong("CHECKIN_GRACE_MINUTES", 15L);
        LocalDateTime now = LocalDateTime.now(checkInClock);
        if (!now.isAfter(booking.getStartTime().plusMinutes(grace))) return false;
        booking.setStatus(BookingStatus.NO_SHOW);
        bookings.save(booking);
        audits.save(BookingAuditLog.builder().bookingId(id).action(AuditAction.NO_SHOW_TIMEOUT)
                .performedByEmail("system@eduspace.vn").performedAt(now)
                .reason("CHECKIN_WINDOW_EXPIRED").note("Quá hạn check-in -> NO_SHOW").build());
        return true;
    }
}
