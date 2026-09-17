package com.eduspace.backend.policy.controller;

import com.eduspace.backend.policy.dto.request.PolicyUpdateRequest;
import com.eduspace.backend.policy.dto.response.AuditLogResponse;
import com.eduspace.backend.policy.dto.response.PolicyResponse;
import com.eduspace.backend.policy.service.PolicyService;
import com.eduspace.backend.security.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/policies")
@RequiredArgsConstructor
public class AdminPolicyController {

    private final PolicyService policyService;

    // Lấy cấu hình chính sách hiện hành (ADMIN và STAFF đều có thể xem)
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<PolicyResponse> getPolicy() {
        return ResponseEntity.ok(policyService.getPolicy());
    }

    // Cập nhật cấu hình chính sách (Chỉ ADMIN mới có quyền)
    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PolicyResponse> updatePolicy(@Valid @RequestBody PolicyUpdateRequest request) {
        String adminEmail = SecurityUtils.getCurrentUserEmail();
        PolicyResponse updated = policyService.updatePolicy(request, adminEmail);
        return ResponseEntity.ok(updated);
    }

    // Xem lịch sử thay đổi cấu hình chính sách (Audit log - Chỉ ADMIN)
    @GetMapping("/history")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AuditLogResponse>> getPolicyHistory() {
        return ResponseEntity.ok(policyService.getPolicyAuditLogs());
    }
}
