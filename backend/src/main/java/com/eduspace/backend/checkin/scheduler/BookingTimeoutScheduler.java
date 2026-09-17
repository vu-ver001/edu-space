package com.eduspace.backend.checkin.scheduler;

import com.eduspace.backend.booking.repository.BookingRepository;
import com.eduspace.backend.booking.service.AvailabilityService;
import com.eduspace.backend.checkin.policy.service.PolicyService;
import com.eduspace.backend.checkin.service.BookingTimeoutService;
import java.time.Clock;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@EnableScheduling
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "booking.scheduler.enabled", havingValue = "true", matchIfMissing = true)
public class BookingTimeoutScheduler {
    private final BookingRepository bookings;
    private final BookingTimeoutService timeouts;
    private final AvailabilityService availability;
    private final PolicyService policies;
    private final Clock checkInClock;

    @Scheduled(fixedDelayString = "${booking.scheduler.delay-ms:30000}")
    public void sweep() {
        LocalDateTime now = LocalDateTime.now(checkInClock);
        availability.expirePendingApproval(now);
        long grace = policies.getLong("CHECKIN_GRACE_MINUTES", 15L);
        for (Long id : bookings.findNoShowCandidateIds(now.minusMinutes(grace))) {
            try {
                timeouts.markNoShow(id);
            } catch (RuntimeException ex) {
                log.error("Không thể xử lý timeout booking #{}; sẽ thử lại ở lượt sau", id, ex);
            }
        }
    }
}
