package com.eduspace.backend.policy.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogResponse {

    private Long id;
    private String action;
    private String targetType;
    private String targetId;
    private String oldValue;
    private String newValue;
    private String performedBy;
    private LocalDateTime performedAt;
}
