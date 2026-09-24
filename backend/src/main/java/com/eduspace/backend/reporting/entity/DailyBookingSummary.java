package com.eduspace.backend.reporting.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "daily_booking_summary", indexes = {
        @Index(name = "idx_daily_summary_stat_date", columnList = "stat_date", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyBookingSummary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "stat_date", nullable = false, unique = true)
    private LocalDate statDate;

    @Column(name = "total_bookings", nullable = false)
    @Builder.Default
    private long totalBookings = 0;

    @Column(name = "completed_count", nullable = false)
    @Builder.Default
    private long completedCount = 0;

    @Column(name = "checked_in_count", nullable = false)
    @Builder.Default
    private long checkedInCount = 0;

    @Column(name = "confirmed_count", nullable = false)
    @Builder.Default
    private long confirmedCount = 0;

    @Column(name = "pending_approval_count", nullable = false)
    @Builder.Default
    private long pendingApprovalCount = 0;

    @Column(name = "no_show_count", nullable = false)
    @Builder.Default
    private long noShowCount = 0;

    @Column(name = "cancelled_count", nullable = false)
    @Builder.Default
    private long cancelledCount = 0;

    @Column(name = "rejected_count", nullable = false)
    @Builder.Default
    private long rejectedCount = 0;

    @Column(name = "expired_count", nullable = false)
    @Builder.Default
    private long expiredCount = 0;

    @Column(name = "calculated_at", nullable = false)
    private LocalDateTime calculatedAt;
}
