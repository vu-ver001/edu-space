package com.eduspace.backend.staff.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffAuditLogPageResponseKT {

    private List<StaffAuditLogResponseKT> content;

    private int page;

    private int size;

    private long totalElements;

    private int totalPages;
}
