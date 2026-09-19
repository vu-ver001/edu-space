package com.eduspace.backend.staff.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaintenanceResponseKT {

    private Long id;

    private Long spaceId;

    private String spaceName;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private String reason;

    private Long createdBy;

    private String creatorEmail;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private LocalDateTime deletedAt;

    private boolean active;
}
