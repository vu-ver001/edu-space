package com.eduspace.backend.reporting.service.impl;

import com.eduspace.backend.reporting.dto.response.DashboardStatisticsResponse;
import com.eduspace.backend.reporting.entity.DailyBookingSummary;
import com.eduspace.backend.reporting.repository.DailyBookingSummaryRepository;
import com.eduspace.backend.reporting.service.DailyBookingSummaryService;
import com.eduspace.backend.reporting.service.StatisticsService;
import com.eduspace.backend.space.entity.SeatStatus;
import com.eduspace.backend.space.entity.SpaceStatus;
import com.eduspace.backend.space.entity.SpaceTableStatus;
import com.eduspace.backend.space.repository.SeatRepository;
import com.eduspace.backend.space.repository.SpaceRepository;
import com.eduspace.backend.space.repository.SpaceTableRepository;
import com.eduspace.backend.staff.repository.MaintenanceBlockRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class StatisticsServiceImpl implements StatisticsService {

    private final DailyBookingSummaryService dailyBookingSummaryService;
    private final DailyBookingSummaryRepository dailyBookingSummaryRepository;
    private final SpaceRepository spaceRepository;
    private final SpaceTableRepository spaceTableRepository;
    private final SeatRepository seatRepository;
    private final MaintenanceBlockRepository maintenanceBlockRepository;

    @Override
    public DashboardStatisticsResponse getDashboardStatistics(LocalDateTime from, LocalDateTime to) {
        LocalDateTime effectiveFrom = (from != null) ? from : LocalDateTime.now().minusDays(30);
        LocalDateTime effectiveTo = (to != null) ? to : LocalDateTime.now().plusDays(1);

        LocalDate startDate = effectiveFrom.toLocalDate();
        LocalDate endDate = effectiveTo.toLocalDate();

        // Đảm bảo số liệu ngày hôm nay luôn mới nhất nếu khoảng thời gian bao gồm ngày hôm nay
        LocalDate today = LocalDate.now();
        if (!startDate.isAfter(today) && !endDate.isBefore(today)) {
            dailyBookingSummaryService.aggregateToday();
        }

        // Lấy danh sách số liệu đã tổng hợp từ bảng daily_booking_summary (không query trực tiếp bảng bookings)
        List<DailyBookingSummary> summaries = dailyBookingSummaryRepository.findByStatDateBetweenOrderByStatDateAsc(startDate, endDate);

        // Nếu bảng rỗng (chưa chạy backfill), thực hiện backfill tự động
        if (summaries.isEmpty()) {
            dailyBookingSummaryService.backfillHistoricalData();
            summaries = dailyBookingSummaryRepository.findByStatDateBetweenOrderByStatDateAsc(startDate, endDate);
        }

        // Tính tổng các chỉ số từ lớp tổng hợp pre-aggregated
        long totalBookings = 0;
        long pendingApprovalCount = 0;
        long confirmedCount = 0;
        long checkedInCount = 0;
        long completedCount = 0;
        long noShowCount = 0;
        long expiredPendingCount = 0;
        long cancelledCount = 0;
        long rejectedCount = 0;
        LocalDateTime latestCalculatedAt = null;

        for (DailyBookingSummary s : summaries) {
            totalBookings += s.getTotalBookings();
            pendingApprovalCount += s.getPendingApprovalCount();
            confirmedCount += s.getConfirmedCount();
            checkedInCount += s.getCheckedInCount();
            completedCount += s.getCompletedCount();
            noShowCount += s.getNoShowCount();
            expiredPendingCount += s.getExpiredCount();
            cancelledCount += s.getCancelledCount();
            rejectedCount += s.getRejectedCount();

            if (s.getCalculatedAt() != null) {
                if (latestCalculatedAt == null || s.getCalculatedAt().isAfter(latestCalculatedAt)) {
                    latestCalculatedAt = s.getCalculatedAt();
                }
            }
        }

        if (latestCalculatedAt == null) {
            latestCalculatedAt = LocalDateTime.now();
        }

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

        // 5. Đếm số lượng tài nguyên đang bảo trì từ nhiều bảng (spaces, space_tables, seats, maintenance_blocks)
        long spacesStatusMaintenance = spaceRepository.countByStatus(SpaceStatus.MAINTENANCE);
        long spacesActiveBlocks = maintenanceBlockRepository.countActiveMaintenanceSpaces();
        long maintenanceSpacesCount = Math.max(spacesStatusMaintenance, spacesActiveBlocks);

        long maintenanceTablesCount = spaceTableRepository.countByStatusAndDeletedAtIsNull(SpaceTableStatus.INACTIVE);
        long maintenanceSeatsCount = seatRepository.countByStatusAndDeletedAtIsNull(SeatStatus.INACTIVE);
        long totalMaintenanceCount = maintenanceSpacesCount + maintenanceTablesCount + maintenanceSeatsCount;

        // 6. Thu thập danh sách chi tiết từng phòng, bàn, ghế đang bảo trì / tạm ngừng
        java.util.List<com.eduspace.backend.reporting.dto.response.MaintenanceResourceDetailResponse> maintenanceDetails = new java.util.ArrayList<>();

        // Phòng bảo trì theo trạng thái
        java.util.List<com.eduspace.backend.space.entity.Space> maintenanceSpaces = spaceRepository.findAllByStatusAndDeletedAtIsNull(SpaceStatus.MAINTENANCE);
        for (com.eduspace.backend.space.entity.Space s : maintenanceSpaces) {
            maintenanceDetails.add(com.eduspace.backend.reporting.dto.response.MaintenanceResourceDetailResponse.builder()
                    .resourceType("Phòng học")
                    .resourceCode(s.getSpaceCode())
                    .resourceName(s.getName())
                    .spaceCode(s.getSpaceCode())
                    .spaceName(s.getName())
                    .location(s.getBuilding() + " - Tầng " + s.getFloor())
                    .reason((s.getDescription() != null && !s.getDescription().isBlank()) ? s.getDescription() : "Đang bảo trì định kỳ / khóa phòng")
                    .statusText("Đang bảo trì")
                    .build());
        }

        // Phòng bảo trì theo lịch khóa (maintenance_blocks)
        java.util.List<com.eduspace.backend.space.entity.MaintenanceBlock> activeBlocks = maintenanceBlockRepository.findActiveMaintenanceBlocks();
        for (com.eduspace.backend.space.entity.MaintenanceBlock mb : activeBlocks) {
            com.eduspace.backend.space.entity.Space s = mb.getSpace();
            boolean alreadyInList = maintenanceSpaces.stream().anyMatch(ms -> ms.getId().equals(s.getId()));
            if (!alreadyInList) {
                maintenanceDetails.add(com.eduspace.backend.reporting.dto.response.MaintenanceResourceDetailResponse.builder()
                        .resourceType("Phòng học (Khóa lịch)")
                        .resourceCode(s.getSpaceCode())
                        .resourceName(s.getName())
                        .spaceCode(s.getSpaceCode())
                        .spaceName(s.getName())
                        .location(s.getBuilding() + " - Tầng " + s.getFloor())
                        .reason(mb.getReason())
                        .startTime(mb.getStartTime())
                        .endTime(mb.getEndTime())
                        .statusText("Khóa lịch bảo trì")
                        .build());
            }
        }

        // Bàn nhóm INACTIVE
        java.util.List<com.eduspace.backend.space.entity.SpaceTable> inactiveTables = spaceTableRepository.findAllByStatusWithSpace(SpaceTableStatus.INACTIVE);
        for (com.eduspace.backend.space.entity.SpaceTable t : inactiveTables) {
            com.eduspace.backend.space.entity.Space s = t.getSpace();
            maintenanceDetails.add(com.eduspace.backend.reporting.dto.response.MaintenanceResourceDetailResponse.builder()
                    .resourceType("Bàn nhóm")
                    .resourceCode(t.getTableCode())
                    .resourceName("Bàn " + t.getTableCode())
                    .spaceCode(s != null ? s.getSpaceCode() : "-")
                    .spaceName(s != null ? s.getName() : "-")
                    .location(s != null ? s.getBuilding() + " - Tầng " + s.getFloor() : "-")
                    .reason((t.getDescription() != null && !t.getDescription().isBlank()) ? t.getDescription() : "Tạm ngừng phục vụ")
                    .statusText("Tạm ngừng")
                    .build());
        }

        // Ghế ngồi INACTIVE
        java.util.List<com.eduspace.backend.space.entity.Seat> inactiveSeats = seatRepository.findAllByStatusWithSpace(SeatStatus.INACTIVE);
        for (com.eduspace.backend.space.entity.Seat st : inactiveSeats) {
            com.eduspace.backend.space.entity.Space s = st.getSpace();
            maintenanceDetails.add(com.eduspace.backend.reporting.dto.response.MaintenanceResourceDetailResponse.builder()
                    .resourceType("Ghế ngồi")
                    .resourceCode(st.getSeatCode())
                    .resourceName("Ghế " + st.getSeatCode())
                    .spaceCode(s != null ? s.getSpaceCode() : "-")
                    .spaceName(s != null ? s.getName() : "-")
                    .location(s != null ? s.getBuilding() + " - Tầng " + s.getFloor() : "-")
                    .reason((st.getDescription() != null && !st.getDescription().isBlank()) ? st.getDescription() : "Hỏng hóc / chờ thay thế")
                    .statusText("Tạm ngừng")
                    .build());
        }

        return DashboardStatisticsResponse.builder()
                .fromDate(effectiveFrom)
                .toDate(effectiveTo)
                .totalBookings(totalBookings)
                .actualUsageRate(actualUsageRate)
                .noShowRate(noShowRate)
                .pendingApprovalCount(pendingApprovalCount)
                .expiredPendingCount(expiredPendingCount)
                .maintenanceSpacesCount(maintenanceSpacesCount)
                .maintenanceTablesCount(maintenanceTablesCount)
                .maintenanceSeatsCount(maintenanceSeatsCount)
                .totalMaintenanceCount(totalMaintenanceCount)
                .confirmedCount(confirmedCount)
                .checkedInCount(checkedInCount)
                .completedCount(completedCount)
                .noShowCount(noShowCount)
                .cancelledCount(cancelledCount)
                .rejectedCount(rejectedCount)
                .calculatedAt(latestCalculatedAt)
                .maintenanceDetails(maintenanceDetails)
                .build();
    }
}
