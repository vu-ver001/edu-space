package com.eduspace.backend.booking.dto.response;

import com.eduspace.backend.booking.entity.AuditAction;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BookingAuditLogResponse {
    private Long id;
    private Long bookingId;
    private AuditAction action;
    private String actionDescription;
    private String performedByName;
    private String performedByEmail;
    private LocalDateTime performedAt;
    private String reason;
    private String note;
}
