package com.eduspace.backend.staff.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffTimelineEventResponseKT {

    /**
     * Loại sự kiện: "BOOKING" hoặc "MAINTENANCE"
     */
    private String eventType;

    private Long eventId;

    private Long spaceId;

    private String spaceName;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private String status;

    private String title;

    private String bookingMode;

    private Long tableId;

    private String tableCode;

    private List<String> selectedSeats;

    private Integer participantCount;

    private String purpose;

    private Long studentId;

    private String studentName;

    private String studentEmail;

    private String reason;

    private Long createdBy;

    private String creatorEmail;

    private LocalDateTime createdAt;
}
