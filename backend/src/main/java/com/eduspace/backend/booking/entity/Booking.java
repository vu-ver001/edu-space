package com.eduspace.backend.booking.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Arrays;
import java.util.stream.Collectors;

@Entity
@Table(name = "bookings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "space_id", nullable = false)
    private Long spaceId;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(name = "participant_count", nullable = false)
    private Integer participantCount;

    @Column(length = 255)
    private String purpose;

    @Column(name = "selected_seats", length = 255)
    private String selectedSeats;

    @Column(name = "table_id")
    private Long tableId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private BookingStatus status = BookingStatus.CONFIRMED;

    public List<String> getSelectedSeatsList() {
        if (selectedSeats == null || selectedSeats.isBlank()) {
            return Collections.emptyList();
        }
        return Arrays.stream(selectedSeats.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    public void setSelectedSeatsList(List<String> seats) {
        if (seats == null || seats.isEmpty()) {
            this.selectedSeats = null;
        } else {
            this.selectedSeats = String.join(",", seats);
        }
    }

    @Column(name = "rejected_by")
    private Long rejectedBy;

    @Column(name = "rejected_at")
    private LocalDateTime rejectedAt;

    @Column(name = "reject_reason", columnDefinition = "TEXT")
    private String rejectReason;

    @Column(name = "expired_at")
    private LocalDateTime expiredAt;

    @Column(name = "expire_reason", length = 100)
    private String expireReason;

    @Column(name = "checked_in_at")
    private LocalDateTime checkedInAt;

    @Column(name = "checked_in_by")
    private Long checkedInBy;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
