package com.eduspace.backend.booking.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;




@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConflictDetail {
    private String type; // "BOOKING" hoặc "MAINTENANCE" hoặc "STUDENT_SCHEDULE"
    private Long referenceId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String description;
}
