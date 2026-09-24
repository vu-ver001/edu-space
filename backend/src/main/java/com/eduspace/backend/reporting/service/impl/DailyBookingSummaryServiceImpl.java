package com.eduspace.backend.reporting.service.impl;

import com.eduspace.backend.booking.entity.BookingStatus;
import com.eduspace.backend.booking.repository.BookingRepository;
import com.eduspace.backend.reporting.entity.DailyBookingSummary;
import com.eduspace.backend.reporting.repository.DailyBookingSummaryRepository;
import com.eduspace.backend.reporting.service.DailyBookingSummaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DailyBookingSummaryServiceImpl implements DailyBookingSummaryService {

    private final BookingRepository bookingRepository;
    private final DailyBookingSummaryRepository summaryRepository;

    @Override
    @Transactional
    public DailyBookingSummary aggregateDate(LocalDate date) {
        if (date == null) {
            return null;
        }

        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(LocalTime.MAX);

        long totalBookings = bookingRepository.countByCreatedAtBetween(startOfDay, endOfDay);
        long pendingApproval = bookingRepository.countByStatusAndCreatedAtBetween(BookingStatus.PENDING_APPROVAL, startOfDay, endOfDay);
        long confirmed = bookingRepository.countByStatusAndCreatedAtBetween(BookingStatus.CONFIRMED, startOfDay, endOfDay);
        long checkedIn = bookingRepository.countByStatusAndCreatedAtBetween(BookingStatus.CHECKED_IN, startOfDay, endOfDay);
        long completed = bookingRepository.countByStatusAndCreatedAtBetween(BookingStatus.COMPLETED, startOfDay, endOfDay);
        long noShow = bookingRepository.countByStatusAndCreatedAtBetween(BookingStatus.NO_SHOW, startOfDay, endOfDay);
        long expired = bookingRepository.countByStatusAndCreatedAtBetween(BookingStatus.EXPIRED, startOfDay, endOfDay);
        long cancelled = bookingRepository.countByStatusAndCreatedAtBetween(BookingStatus.CANCELLED, startOfDay, endOfDay);
        long rejected = bookingRepository.countByStatusAndCreatedAtBetween(BookingStatus.REJECTED, startOfDay, endOfDay);

        DailyBookingSummary summary = summaryRepository.findByStatDate(date)
                .orElse(DailyBookingSummary.builder().statDate(date).build());

        summary.setTotalBookings(totalBookings);
        summary.setPendingApprovalCount(pendingApproval);
        summary.setConfirmedCount(confirmed);
        summary.setCheckedInCount(checkedIn);
        summary.setCompletedCount(completed);
        summary.setNoShowCount(noShow);
        summary.setExpiredCount(expired);
        summary.setCancelledCount(cancelled);
        summary.setRejectedCount(rejected);
        summary.setCalculatedAt(LocalDateTime.now());

        return summaryRepository.save(summary);
    }

    @Override
    @Transactional
    public DailyBookingSummary aggregateToday() {
        return aggregateDate(LocalDate.now());
    }

    @Override
    @Transactional
    public DailyBookingSummary aggregateYesterday() {
        return aggregateDate(LocalDate.now().minusDays(1));
    }

    @Override
    @Transactional
    public void backfillHistoricalData() {
        LocalDateTime earliestBookingTime = bookingRepository.findEarliestCreatedAt();
        LocalDate startDate = (earliestBookingTime != null)
                ? earliestBookingTime.toLocalDate()
                : LocalDate.now().minusDays(30);

        LocalDate today = LocalDate.now();
        log.info("Starting historical data backfill for daily_booking_summary from {} to {}", startDate, today);

        LocalDate current = startDate;
        while (!current.isAfter(today)) {
            aggregateDate(current);
            current = current.plusDays(1);
        }
        log.info("Finished historical data backfill for daily_booking_summary.");
    }

    @Override
    @Transactional(readOnly = true)
    public List<DailyBookingSummary> getSummariesBetween(LocalDate startDate, LocalDate endDate) {
        return summaryRepository.findByStatDateBetweenOrderByStatDateAsc(startDate, endDate);
    }
}
