package com.eduspace.backend.booking.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

import com.eduspace.backend.booking.entity.AuditAction;
import com.eduspace.backend.booking.entity.Booking;
import com.eduspace.backend.booking.entity.BookingAuditLog;
import com.eduspace.backend.booking.entity.BookingStatus;
import com.eduspace.backend.booking.repository.BookingAuditLogRepository;
import com.eduspace.backend.booking.repository.BookingRepository;
import com.eduspace.backend.booking.service.AvailabilityService;




/**
 * Công việc chạy nền định kỳ (Scheduler) tự động chuyển trạng thái booking phụ thuộc thời gian:
 * - PENDING_APPROVAL quá startTime -> EXPIRED (02_Yeu_cau_logic §8.3)
 * - CONFIRMED quá hạn check-in (startTime + graceMinutes) -> NO_SHOW (02_Yeu_cau_logic §8.2)
 * - CHECKED_IN quá endTime -> COMPLETED (02_Yeu_cau_logic §8.4)
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class BookingStateScheduler {

    private final BookingRepository bookingRepository;
    private final BookingAuditLogRepository auditLogRepository;
    private final AvailabilityService availabilityService;

    @Scheduled(fixedRate = 30000) // Chạy mỗi 30 giây
    @Transactional
    public void runPeriodicStateTransitions() {
        LocalDateTime now = LocalDateTime.now();

        // 1. Quét PENDING_APPROVAL quá giờ bắt đầu -> Chuyển sang EXPIRED
        List<Booking> overduePending = bookingRepository.findPendingOverdueBookings(BookingStatus.PENDING_APPROVAL, now);
        for (Booking b : overduePending) {
            b.setStatus(BookingStatus.EXPIRED);
            b.setExpiredAt(now);
            b.setExpireReason("PENDING_APPROVAL_TIMEOUT");
            bookingRepository.save(b);

            BookingAuditLog audit = BookingAuditLog.builder()
                    .bookingId(b.getId())
                    .action(AuditAction.EXPIRE_TIMEOUT)
                    .performedBy(null) // SYSTEM
                    .performedAt(now)
                    .reason("PENDING_APPROVAL_TIMEOUT")
                    .note("Quá giờ bắt đầu chưa được Staff xử lý -> Chuyển sang EXPIRED và giải phóng phòng")
                    .build();
            auditLogRepository.save(audit);
            log.info("[Scheduler] Booking #{} chuyển sang EXPIRED", b.getId());
        }

        // 2. Quét CONFIRMED quá hạn check-in -> Chuyển sang NO_SHOW
        long graceMinutes = availabilityService.getPolicyLong("CHECKIN_GRACE_MINUTES", 15L);
        LocalDateTime threshold = now.minusMinutes(graceMinutes);
        List<Booking> noShowCandidates = bookingRepository.findConfirmedNoShowBookings(BookingStatus.CONFIRMED, threshold);
        for (Booking b : noShowCandidates) {
            b.setStatus(BookingStatus.NO_SHOW);
            bookingRepository.save(b);

            BookingAuditLog audit = BookingAuditLog.builder()
                    .bookingId(b.getId())
                    .action(AuditAction.NO_SHOW_TIMEOUT)
                    .performedBy(null) // SYSTEM
                    .performedAt(now)
                    .reason("CHECKIN_DEADLINE_EXCEEDED")
                    .note("Quá thời hạn check-in (" + graceMinutes + " phút sau giờ bắt đầu) -> Đánh dấu NO_SHOW")
                    .build();
            auditLogRepository.save(audit);
            log.info("[Scheduler] Booking #{} chuyển sang NO_SHOW do quá hạn check-in", b.getId());
        }

        // 3. Quét CHECKED_IN qua endTime -> Chuyển sang COMPLETED
        List<Booking> completedCandidates = bookingRepository.findCompletedCandidateBookings(BookingStatus.CHECKED_IN, now);
        for (Booking b : completedCandidates) {
            b.setStatus(BookingStatus.COMPLETED);
            bookingRepository.save(b);

            BookingAuditLog audit = BookingAuditLog.builder()
                    .bookingId(b.getId())
                    .action(AuditAction.COMPLETE_TIMEOUT)
                    .performedBy(null) // SYSTEM
                    .performedAt(now)
                    .reason("SESSION_ENDED")
                    .note("Hết giờ sử dụng phòng -> Đánh dấu COMPLETED thành công")
                    .build();
            auditLogRepository.save(audit);
            log.info("[Scheduler] Booking #{} chuyển sang COMPLETED", b.getId());
        }
    }
}
