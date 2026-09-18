package com.eduspace.backend.booking.dto.response;

import com.eduspace.backend.booking.entity.AuditAction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
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
