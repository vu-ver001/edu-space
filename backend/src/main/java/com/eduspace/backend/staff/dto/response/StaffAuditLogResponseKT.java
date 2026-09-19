package com.eduspace.backend.staff.dto.response;

import com.eduspace.backend.staff.entity.StaffAuditAction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffAuditLogResponseKT {

    private Long id;

    private Long actorUserId;

    private String actorEmail;

    private StaffAuditAction action;

    private String actionDescription;

    private String targetType;

    private Long targetId;

    private Long spaceId;

    private String details;

    private LocalDateTime createdAt;
}
