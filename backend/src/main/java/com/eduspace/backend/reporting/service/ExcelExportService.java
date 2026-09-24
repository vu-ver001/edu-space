package com.eduspace.backend.reporting.service;

import com.eduspace.backend.reporting.dto.response.DashboardStatisticsResponse;
import com.eduspace.backend.reporting.entity.DailyBookingSummary;

import java.util.List;

public interface ExcelExportService {

    /**
     * Xuất báo cáo thống kê vận hành sang định dạng file Excel (.xlsx) chuẩn, khoa học.
     */
    byte[] generateStatisticsExcel(DashboardStatisticsResponse stats, List<DailyBookingSummary> dailySummaries);
}
