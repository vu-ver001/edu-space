package com.eduspace.backend.policy.service.impl;

import com.eduspace.backend.common.exception.BusinessException;
import com.eduspace.backend.policy.dto.request.PolicyUpdateRequest;
import com.eduspace.backend.policy.dto.response.AuditLogResponse;
import com.eduspace.backend.policy.dto.response.PolicyResponse;
import com.eduspace.backend.policy.entity.AuditLog;
import com.eduspace.backend.policy.entity.BookingPolicy;
import com.eduspace.backend.policy.repository.AdminPolicyRepository;
import com.eduspace.backend.policy.repository.AuditLogRepository;
import com.eduspace.backend.policy.service.PolicyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PolicyServiceImpl implements PolicyService {

    private final AdminPolicyRepository policyRepository;
    private final AuditLogRepository auditLogRepository;

    @Override
    public PolicyResponse getPolicy() {
        BookingPolicy policy = getRawPolicy();
        return mapToResponse(policy);
    }

    @Override
    public BookingPolicy getRawPolicy() {
        return policyRepository.findTopByOrderByIdAsc()
                .orElseGet(() -> {
                    // Nếu chưa có, tạo cấu hình mặc định
                    BookingPolicy defaultPolicy = new BookingPolicy();
                    defaultPolicy.setUpdatedBy("SYSTEM_INIT");
                    return policyRepository.save(defaultPolicy);
                });
    }

    @Override
    @Transactional
    public PolicyResponse updatePolicy(PolicyUpdateRequest request, String updatedBy) {
        // 1. Kiểm tra quy tắc nghiệp vụ quan trọng R-19 theo đặc tả:
        // Mốc đóng cửa sổ check-in phải đúng bằng khoảng thời gian ân hạn đã cấu hình
        if (request.getCheckInCloseOffsetMinutes() != null
                && !request.getCheckInCloseOffsetMinutes().equals(request.getCheckInGraceMinutes())) {
            throw new BusinessException(
                    "INVALID_POLICY_CONFIGURATION",
                    "Mốc đóng cửa sổ check-in (" + request.getCheckInCloseOffsetMinutes()
                            + " phút) phải đúng bằng khoảng thời gian ân hạn (" + request.getCheckInGraceMinutes()
                            + " phút) đã cấu hình (Quy tắc R-19).",
                    HttpStatus.BAD_REQUEST
            );
        }

        if (request.getCheckInGraceMinutes() <= 0) {
            throw new BusinessException("INVALID_POLICY_CONFIGURATION", "Thời gian ân hạn check-in phải lớn hơn 0 phút.", HttpStatus.BAD_REQUEST);
        }

        if (request.getMaxDurationMinutes() < 15) {
            throw new BusinessException("INVALID_POLICY_CONFIGURATION", "Thời lượng tối đa mỗi lần đặt phải từ 15 phút trở lên.", HttpStatus.BAD_REQUEST);
        }

        if (request.getMaxBookingsPerDay() < 1) {
            throw new BusinessException("INVALID_POLICY_CONFIGURATION", "Hạn mức đặt phòng mỗi ngày phải từ ít nhất là 1.", HttpStatus.BAD_REQUEST);
        }

        if (request.getMaxRequestRatePerHour() < 1) {
            throw new BusinessException("INVALID_POLICY_CONFIGURATION", "Giới hạn tạo yêu cầu/giờ phải từ ít nhất là 1.", HttpStatus.BAD_REQUEST);
        }

        // 2. Lấy cấu hình cũ
        BookingPolicy policy = getRawPolicy();
        String oldValue = toJson(policy);

        // 3. Cập nhật giá trị mới
        policy.setMaxBookingsPerDay(request.getMaxBookingsPerDay());
        policy.setMaxDurationMinutes(request.getMaxDurationMinutes());
        policy.setCheckInGraceMinutes(request.getCheckInGraceMinutes());
        policy.setMaxRequestRatePerHour(request.getMaxRequestRatePerHour());
        policy.setCheckInEarlyOpenMinutes(request.getCheckInEarlyOpenMinutes());
        policy.setUpdatedBy(updatedBy != null ? updatedBy : "UNKNOWN_ADMIN");

        BookingPolicy saved = policyRepository.save(policy);
        String newValue = toJson(saved);

        // 4. Ghi Audit Log vào bảng lịch sử thao tác dùng chung
        AuditLog auditLog = new AuditLog(
                "UPDATE_POLICY",
                "POLICY",
                saved.getId().toString(),
                oldValue,
                newValue,
                policy.getUpdatedBy()
        );
        auditLogRepository.save(auditLog);

        log.info("Chính sách đặt chỗ đã được cập nhật bởi {}: {}", policy.getUpdatedBy(), newValue);
        return mapToResponse(saved);
    }

    @Override
    public List<AuditLogResponse> getPolicyAuditLogs() {
        return auditLogRepository.findByTargetTypeOrderByPerformedAtDesc("POLICY")
                .stream()
                .map(this::mapToAuditResponse)
                .collect(Collectors.toList());
    }

    private PolicyResponse mapToResponse(BookingPolicy policy) {
        return PolicyResponse.builder()
                .id(policy.getId())
                .maxBookingsPerDay(policy.getMaxBookingsPerDay())
                .maxDurationMinutes(policy.getMaxDurationMinutes())
                .checkInGraceMinutes(policy.getCheckInGraceMinutes())
                .maxRequestRatePerHour(policy.getMaxRequestRatePerHour())
                .checkInEarlyOpenMinutes(policy.getCheckInEarlyOpenMinutes())
                .checkInCloseOffsetMinutes(policy.getCheckInGraceMinutes()) // Đúng theo R-19
                .updatedAt(policy.getUpdatedAt())
                .updatedBy(policy.getUpdatedBy())
                .build();
    }

    private AuditLogResponse mapToAuditResponse(AuditLog log) {
        return AuditLogResponse.builder()
                .id(log.getId())
                .action(log.getAction())
                .targetType(log.getTargetType())
                .targetId(log.getTargetId())
                .oldValue(log.getOldValue())
                .newValue(log.getNewValue())
                .performedBy(log.getPerformedBy())
                .performedAt(log.getPerformedAt())
                .build();
    }

    private String toJson(BookingPolicy policy) {
        if (policy == null) return "{}";
        return String.format(
                "{\"maxBookingsPerDay\":%d,\"maxDurationMinutes\":%d,\"checkInGraceMinutes\":%d,\"maxRequestRatePerHour\":%d,\"checkInEarlyOpenMinutes\":%d}",
                policy.getMaxBookingsPerDay(),
                policy.getMaxDurationMinutes(),
                policy.getCheckInGraceMinutes(),
                policy.getMaxRequestRatePerHour(),
                policy.getCheckInEarlyOpenMinutes()
        );
    }
}
