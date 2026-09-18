package com.eduspace.backend.reporting.service.impl;

import com.eduspace.backend.booking.entity.BookingStatus;
import com.eduspace.backend.booking.repository.BookingRepository;
import com.eduspace.backend.reporting.dto.response.DashboardStatisticsResponse;
import com.eduspace.backend.reporting.service.StatisticsService;
import com.eduspace.backend.space.entity.SpaceStatus;
import com.eduspace.backend.space.repository.SpaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class StatisticsServiceImpl implements StatisticsService {

    private final BookingRepository bookingRepository;
    private final SpaceRepository spaceRepository;

    @Override
    public DashboardStatisticsResponse getDashboardStatistics(LocalDateTime from, LocalDateTime to) {
        LocalDateTime effectiveFrom = (from != null) ? from : LocalDateTime.now().minusDays(30);
        LocalDateTime effectiveTo = (to != null) ? to : LocalDateTime.now().plusDays(1);

        // 1. Đếm tổng số booking trong khoảng thời gian từ DB thật
        long totalBookings = bookingRepository.countByCreatedAtBetween(effectiveFrom, effectiveTo);

        // 2. Đếm số lượng booking theo từng trạng thái
        long pendingApprovalCount = bookingRepository.countByStatusAndCreatedAtBetween(BookingStatus.PENDING_APPROVAL, effectiveFrom, effectiveTo);
        long confirmedCount = bookingRepository.countByStatusAndCreatedAtBetween(BookingStatus.CONFIRMED, effectiveFrom, effectiveTo);
        long checkedInCount = bookingRepository.countByStatusAndCreatedAtBetween(BookingStatus.CHECKED_IN, effectiveFrom, effectiveTo);
        long completedCount = bookingRepository.countByStatusAndCreatedAtBetween(BookingStatus.COMPLETED, effectiveFrom, effectiveTo);
        long noShowCount = bookingRepository.countByStatusAndCreatedAtBetween(BookingStatus.NO_SHOW, effectiveFrom, effectiveTo);
        long expiredPendingCount = bookingRepository.countByStatusAndCreatedAtBetween(BookingStatus.EXPIRED, effectiveFrom, effectiveTo);
        long cancelledCount = bookingRepository.countByStatusAndCreatedAtBetween(BookingStatus.CANCELLED, effectiveFrom, effectiveTo);
        long rejectedCount = bookingRepository.countByStatusAndCreatedAtBetween(BookingStatus.REJECTED, effectiveFrom, effectiveTo);

        // 3. Tính tỷ lệ sử dụng thực tế (CHECKED_IN + COMPLETED) / totalBookings (phần trăm)
        double actualUsageRate = 0.0;
        if (totalBookings > 0) {
            long usedCount = checkedInCount + completedCount;
            actualUsageRate = Math.round(((double) usedCount / totalBookings * 100.0) * 100.0) / 100.0;
        }

        // 4. Tính tỷ lệ không đến (NO_SHOW) / totalBookings (phần trăm)
        double noShowRate = 0.0;
        if (totalBookings > 0) {
            noShowRate = Math.round(((double) noShowCount / totalBookings * 100.0) * 100.0) / 100.0;
        }

        // 5. Đếm số lượng phòng đang bảo trì từ bảng spaces thật
        long maintenanceSpacesCount = spaceRepository.countByStatus(SpaceStatus.MAINTENANCE);

        return DashboardStatisticsResponse.builder()
                .fromDate(effectiveFrom)
                .toDate(effectiveTo)
                .totalBookings(totalBookings)
                .actualUsageRate(actualUsageRate)
                .noShowRate(noShowRate)
                .pendingApprovalCount(pendingApprovalCount)
                .expiredPendingCount(expiredPendingCount)
                .maintenanceSpacesCount(maintenanceSpacesCount)
                .confirmedCount(confirmedCount)
                .checkedInCount(checkedInCount)
                .completedCount(completedCount)
                .noShowCount(noShowCount)
                .cancelledCount(cancelledCount)
                .rejectedCount(rejectedCount)
                .build();
    }
}
