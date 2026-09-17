package com.eduspace.backend.policy.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity(name = "SystemBookingPolicy")
@Table(name = "system_booking_policies")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingPolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Hạn mức số booking/ngày đối với mỗi sinh viên (mặc định: 2)
    @Column(nullable = false)
    private Integer maxBookingsPerDay = 2;

    // Thời lượng tối đa mỗi lần đặt tính theo phút (mặc định: 180 phút = 3 giờ)
    @Column(nullable = false)
    private Integer maxDurationMinutes = 180;

    // Khoảng thời gian ân hạn check-in tính theo phút (mặc định: 15 phút)
    // Quy tắc R-19: Cửa sổ check-in đóng tại (startTime + checkInGraceMinutes)
    @Column(nullable = false)
    private Integer checkInGraceMinutes = 15;

    // Giới hạn số lần gửi request tạo booking trong 1 giờ (mặc định: 10 lần/giờ)
    @Column(nullable = false)
    private Integer maxRequestRatePerHour = 10;

    // Cửa sổ check-in mở trước giờ bắt đầu bao nhiêu phút (mặc định: 15 phút)
    @Column(nullable = false)
    private Integer checkInEarlyOpenMinutes = 15;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "updated_by")
    private String updatedBy;

    @PrePersist
    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
