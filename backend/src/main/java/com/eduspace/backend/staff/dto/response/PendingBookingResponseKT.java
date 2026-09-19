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
public class PendingBookingResponseKT {

    private Long bookingId;

    private Long spaceId;

    private String spaceName;

    private String spaceTypeName;

    private String bookingMode;

    private Long tableId;

    private String tableCode;

    private List<String> selectedSeats;

    private Long studentId;

    private String studentName;

    private String studentEmail;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private Integer participantCount;

    private String purpose;

    private String status;

    private String statusDisplayName;

    private boolean requiresApproval;

    private LocalDateTime createdAt;

    public Long getId() {
        return bookingId;
    }
}
