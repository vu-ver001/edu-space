package com.eduspace.backend.checkin.policy.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PolicyResponse {

    private Long id;
    private Integer maxBookingsPerDay;
    private Integer maxDurationMinutes;
    private Integer checkInGraceMinutes;
    private Integer maxRequestRatePerHour;
    private Integer checkInEarlyOpenMinutes;

    // Mốc đóng cửa sổ check-in (tính bằng phút sau giờ bắt đầu, đúng bằng checkInGraceMinutes theo R-19)
    private Integer checkInCloseOffsetMinutes;

    // Khung giờ hoạt động toàn hệ thống
    private String openingHour;
    private String closingHour;

    private LocalDateTime updatedAt;
    private String updatedBy;
}
