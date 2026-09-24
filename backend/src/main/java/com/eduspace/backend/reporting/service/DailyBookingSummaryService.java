package com.eduspace.backend.reporting.service;

import com.eduspace.backend.reporting.entity.DailyBookingSummary;

import java.time.LocalDate;
import java.util.List;

public interface DailyBookingSummaryService {

    /**
     * Tổng hợp và lưu/cập nhật số liệu của một ngày cụ thể vào bảng daily_booking_summary.
     */
    DailyBookingSummary aggregateDate(LocalDate date);

    /**
     * Tổng hợp số liệu ngày hôm nay (chạy định kỳ trong ngày).
     */
    DailyBookingSummary aggregateToday();

    /**
     * Tổng hợp và chốt số liệu ngày hôm qua (chạy vào đầu ngày mới).
     */
    DailyBookingSummary aggregateYesterday();

    /**
     * Quét và tính toán dữ liệu lịch sử từ booking đầu tiên đến hiện tại (dùng khi khởi động hoặc làm mới).
     */
    void backfillHistoricalData();

    /**
     * Lấy danh sách thống kê đã tổng hợp theo khoảng ngày.
     */
    List<DailyBookingSummary> getSummariesBetween(LocalDate startDate, LocalDate endDate);
}
