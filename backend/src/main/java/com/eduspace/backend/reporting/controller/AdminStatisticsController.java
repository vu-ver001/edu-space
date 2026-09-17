package com.eduspace.backend.reporting.controller;

import com.eduspace.backend.reporting.dto.response.DashboardStatisticsResponse;
import com.eduspace.backend.reporting.service.StatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@RestController
@RequestMapping("/api/admin/statistics")
@RequiredArgsConstructor
public class AdminStatisticsController {

    private final StatisticsService statisticsService;

    // Xem số liệu thống kê cơ bản từ dữ liệu thật (ADMIN và STAFF)
    @GetMapping({"", "/dashboard"})
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<DashboardStatisticsResponse> getDashboardStatistics(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to
    ) {
        LocalDateTime fromDate = parseDateTime(from, false);
        LocalDateTime toDate = parseDateTime(to, true);
        return ResponseEntity.ok(statisticsService.getDashboardStatistics(fromDate, toDate));
    }

    private LocalDateTime parseDateTime(String text, boolean endOfDay) {
        if (text == null || text.isBlank()) {
            return null;
        }
        text = text.trim();
        try {
            if (text.contains("T")) {
                return LocalDateTime.parse(text);
            } else {
                LocalDate date = LocalDate.parse(text);
                return endOfDay ? date.atTime(LocalTime.MAX) : date.atStartOfDay();
            }
        } catch (Exception e) {
            return null;
        }
    }
}
