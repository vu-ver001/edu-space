package com.eduspace.backend.booking.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

import com.eduspace.backend.booking.entity.BookingStatus;




@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingResponse {
    private Long id;
    private Long studentId;
    private String studentName;
    private String studentEmail;
    private Long spaceId;
    private String spaceName;
    private String spaceTypeName;
    private boolean requiresApproval;
    private String building;
    private String floor;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer participantCount;
    private String purpose;
    private BookingStatus status;
    private String statusDisplayName;
    private boolean isOccupying;
    private String rejectReason;
    private LocalDateTime rejectedAt;
    private String expireReason;
    private LocalDateTime expiredAt;
    private LocalDateTime checkedInAt;
    private Long checkedInBy;
    private LocalDateTime createdAt;
    private boolean canCancel;
    private boolean canCheckIn;
    private java.util.List<String> selectedSeats;
}
