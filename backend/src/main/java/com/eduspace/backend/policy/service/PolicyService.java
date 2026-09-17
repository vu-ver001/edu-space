package com.eduspace.backend.policy.service;

import com.eduspace.backend.policy.dto.request.PolicyUpdateRequest;
import com.eduspace.backend.policy.dto.response.AuditLogResponse;
import com.eduspace.backend.policy.dto.response.PolicyResponse;
import com.eduspace.backend.policy.entity.BookingPolicy;

import java.util.List;

public interface PolicyService {

    PolicyResponse getPolicy();

    BookingPolicy getRawPolicy();

    PolicyResponse updatePolicy(PolicyUpdateRequest request, String updatedBy);

    List<AuditLogResponse> getPolicyAuditLogs();
}
