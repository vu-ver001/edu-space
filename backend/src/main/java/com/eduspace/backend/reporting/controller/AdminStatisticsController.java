package com.eduspace.backend.reporting.controller;

import com.eduspace.backend.common.exception.AppException;
import com.eduspace.backend.reporting.dto.response.DashboardStatisticsResponse;
import com.eduspace.backend.reporting.entity.DailyBookingSummary;
import com.eduspace.backend.reporting.service.DailyBookingSummaryService;
import com.eduspace.backend.reporting.service.ExcelExportService;
import com.eduspace.backend.reporting.service.StatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api/admin/statistics")
@RequiredArgsConstructor
public class AdminStatisticsController {

    private final StatisticsService statisticsService;
    private final DailyBookingSummaryService dailyBookingSummaryService;
    private final ExcelExportService excelExportService;

    // Xem số liệu thống kê cơ bản từ dữ liệu thật (ADMIN và STAFF)
    @GetMapping({"", "/dashboard"})
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<DashboardStatisticsResponse> getDashboardStatistics(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to
    ) {
        LocalDateTime fromDate = parseDateTime(from, false);
        LocalDateTime toDate = parseDateTime(to, true);

        if (fromDate != null && toDate != null && !toDate.isAfter(fromDate)) {
            throw new AppException(HttpStatus.BAD_REQUEST, "INVALID_DATE_RANGE", "Ngày đến phải lớn hơn từ ngày");
        }

        return ResponseEntity.ok(statisticsService.getDashboardStatistics(fromDate, toDate));
    }

    // Xuất file Excel báo cáo thống kê chuyên sâu (.xlsx)
    @GetMapping("/export-excel")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<byte[]> exportExcel(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to
    ) {
        LocalDateTime fromDate = parseDateTime(from, false);
        LocalDateTime toDate = parseDateTime(to, true);

        if (fromDate != null && toDate != null && !toDate.isAfter(fromDate)) {
            throw new AppException(HttpStatus.BAD_REQUEST, "INVALID_DATE_RANGE", "Ngày đến phải lớn hơn từ ngày");
        }

        DashboardStatisticsResponse stats = statisticsService.getDashboardStatistics(fromDate, toDate);

        // Kiểm tra xem khoảng thời gian / tháng được chọn có dữ liệu hay không
        if (stats.getTotalBookings() == null || stats.getTotalBookings() == 0) {
            String periodName = "Khoảng thời gian này";
            if (fromDate != null && toDate != null) {
                LocalDate start = fromDate.toLocalDate();
                LocalDate end = toDate.toLocalDate();
                if (start.getYear() == end.getYear() && start.getMonth() == end.getMonth()
                        && start.getDayOfMonth() == 1 && end.getDayOfMonth() == end.lengthOfMonth()) {
                    periodName = String.format("Tháng %02d/%d", start.getMonthValue(), start.getYear());
                }
            }
            throw new AppException(HttpStatus.BAD_REQUEST, "NO_REPORT_DATA", periodName + " không có dữ liệu để xuất báo cáo.");
        }

        LocalDate startDate = (fromDate != null) ? fromDate.toLocalDate() : (stats.getFromDate() != null ? stats.getFromDate().toLocalDate() : LocalDate.now().minusDays(30));
        LocalDate endDate = (toDate != null) ? toDate.toLocalDate() : (stats.getToDate() != null ? stats.getToDate().toLocalDate() : LocalDate.now());

        List<DailyBookingSummary> dailySummaries = dailyBookingSummaryService.getSummariesBetween(startDate, endDate);

        byte[] excelBytes = excelExportService.generateStatisticsExcel(stats, dailySummaries);

        String filename;
        if (fromDate != null && toDate != null) {
            LocalDate start = fromDate.toLocalDate();
            LocalDate end = toDate.toLocalDate();
            if (start.getYear() == end.getYear() && start.getMonth() == end.getMonth()
                    && start.getDayOfMonth() == 1 && end.getDayOfMonth() == end.lengthOfMonth()) {
                filename = String.format("Bao_Cao_Thong_Ke_Thang_%02d_%d.xlsx", start.getMonthValue(), start.getYear());
            } else {
                String dateTag = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
                filename = "Thong_Ke_EduSpace_" + dateTag + ".xlsx";
            }
        } else {
            String dateTag = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
            filename = "Thong_Ke_EduSpace_" + dateTag + ".xlsx";
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .header(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS, HttpHeaders.CONTENT_DISPOSITION)
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excelBytes);
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
