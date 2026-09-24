package com.eduspace.backend.reporting.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatisticsResponse {

    // Khoảng thời gian thống kê
    private LocalDateTime fromDate;
    private LocalDateTime toDate;

    // Tổng số booking trong khoảng thời gian
    private Long totalBookings;

    // Tỷ lệ sử dụng thực tế (phần trăm: số booking CHECKED_IN và COMPLETED / tổng số booking)
    private Double actualUsageRate;

    // Tỷ lệ không đến (phần trăm: số booking NO_SHOW / tổng số booking)
    private Double noShowRate;

    // Số booking đang chờ duyệt (PENDING_APPROVAL)
    private Long pendingApprovalCount;

    // Số booking chờ duyệt bị hết hạn (EXPIRED)
    private Long expiredPendingCount;

    // Thống kê tài nguyên đang bảo trì / ngừng phục vụ (Phòng, Bàn, Ghế)
    private Long maintenanceSpacesCount;
    private Long maintenanceTablesCount;
    private Long maintenanceSeatsCount;
    private Long totalMaintenanceCount;

    // Chi tiết số lượng theo từng trạng thái để giao diện dễ vẽ biểu đồ
    private Long confirmedCount;
    private Long checkedInCount;
    private Long completedCount;
    private Long noShowCount;
    private Long cancelledCount;
    private Long rejectedCount;

    // Thời điểm dữ liệu được tổng hợp tính toán gần nhất
    private LocalDateTime calculatedAt;

    // Danh sách chi tiết các phòng, bàn, ghế cụ thể đang bảo trì / tạm ngừng
    private java.util.List<MaintenanceResourceDetailResponse> maintenanceDetails;
}
