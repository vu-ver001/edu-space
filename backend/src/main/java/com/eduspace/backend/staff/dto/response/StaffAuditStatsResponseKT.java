package com.eduspace.backend.staff.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffAuditStatsResponseKT {

    private long totalActions;

    private long approvedCount;

    private long rejectedCount;

    private long checkInCount;

    private long maintenanceCount;
}
