package com.eduspace.backend.reporting.scheduler;

import com.eduspace.backend.reporting.repository.DailyBookingSummaryRepository;
import com.eduspace.backend.reporting.service.DailyBookingSummaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class BookingSummaryScheduledTask {

    private final DailyBookingSummaryService summaryService;
    private final DailyBookingSummaryRepository summaryRepository;

    /**
     * Tự động khởi tạo dữ liệu tổng hợp lịch sử khi ứng dụng khởi động nếu bảng rỗng.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        try {
            long count = summaryRepository.count();
            if (count == 0) {
                log.info("Bảng daily_booking_summary đang rỗng. Bắt đầu tổng hợp dữ liệu lịch sử ban đầu...");
                summaryService.backfillHistoricalData();
            } else {
                // Làm mới ngày hôm nay khi khởi động
                summaryService.aggregateToday();
            }
        } catch (Exception e) {
            log.error("Lỗi khi khởi tạo dữ liệu tổng hợp thống kê ban đầu: {}", e.getMessage(), e);
        }
    }

    /**
     * Chạy định kỳ vào 00:05 mỗi đêm để chốt số liệu ngày hôm qua (ngày đã kết thúc).
     */
    @Scheduled(cron = "0 5 0 * * ?")
    public void runMidnightFinalization() {
        log.info("Chạy tác vụ định kỳ 00:05: Chốt số liệu thống kê ngày hôm qua...");
        try {
            summaryService.aggregateYesterday();
            summaryService.aggregateToday();
        } catch (Exception e) {
            log.error("Lỗi trong tác vụ chốt số liệu thống kê nửa đêm: {}", e.getMessage(), e);
        }
    }

    /**
     * Chạy định kỳ mỗi 15 phút trong ngày để cập nhật số liệu của ngày hôm nay.
     */
    @Scheduled(cron = "0 */15 * * * ?")
    public void runPeriodicTodayAggregation() {
        try {
            summaryService.aggregateToday();
        } catch (Exception e) {
            log.error("Lỗi cập nhật định kỳ số liệu thống kê ngày hôm nay: {}", e.getMessage(), e);
        }
    }
}
