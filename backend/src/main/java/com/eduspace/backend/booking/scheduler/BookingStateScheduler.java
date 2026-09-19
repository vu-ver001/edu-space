package com.eduspace.backend.booking.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;

import com.eduspace.backend.booking.repository.BookingRepository;
import com.eduspace.backend.booking.service.AvailabilityService;
import com.eduspace.backend.checkin.service.BookingTimeoutService;

/**
 * Công việc chạy nền định kỳ (Scheduler) tự động chuyển trạng thái booking phụ thuộc thời gian:
 * - PENDING_APPROVAL quá startTime -> EXPIRED (02_Yeu_cau_logic §8.3)
 * - CONFIRMED quá hạn check-in (startTime + graceMinutes) -> NO_SHOW (02_Yeu_cau_logic §8.2)
 * - CHECKED_IN quá endTime -> COMPLETED (02_Yeu_cau_logic §8.4)
 */
@Component
@EnableScheduling
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "booking.scheduler.enabled", havingValue = "true", matchIfMissing = true)
public class BookingStateScheduler {

    private final BookingRepository bookingRepository;
    private final AvailabilityService availabilityService;
    private final BookingTimeoutService bookingTimeoutService;
    private final Clock checkInClock;

    @Scheduled(fixedDelayString = "${booking.scheduler.delay-ms:30000}")
    public void runPeriodicStateTransitions() {
        LocalDateTime now = LocalDateTime.now(checkInClock);

        // 1. Dùng chung logic của Booking lõi để chuyển PENDING_APPROVAL quá hạn -> EXPIRED.
        availabilityService.expirePendingApproval(now);

        // 2. Khóa từng booking rồi chuyển CONFIRMED quá hạn check-in -> NO_SHOW.
        long graceMinutes = availabilityService.getPolicyLong("CHECKIN_GRACE_MINUTES", 15L);
        for (Long id : bookingRepository.findNoShowCandidateIds(now.minusMinutes(graceMinutes))) {
            try {
                if (bookingTimeoutService.markNoShow(id)) {
                    log.info("[Scheduler] Booking #{} chuyển sang NO_SHOW do quá hạn check-in", id);
                }
            } catch (RuntimeException ex) {
                log.error("Không thể xử lý timeout booking #{}; sẽ thử lại ở lượt sau", id, ex);
            }
        }

        // 3. Quét CHECKED_IN qua endTime -> Chuyển sang COMPLETED
        availabilityService.completeOverdueCheckedIn(now);
    }
}
