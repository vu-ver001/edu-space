package com.eduspace.backend.staff.service;

import com.eduspace.backend.staff.dto.response.StaffAuditLogResponseKT;
import com.eduspace.backend.staff.entity.StaffAuditAction;
import com.eduspace.backend.staff.entity.StaffAuditLog;
import com.eduspace.backend.staff.repository.StaffAuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class StaffAuditService {

    private final StaffAuditLogRepository staffAuditLogRepository;

    /**
     * Ghi nhận nhật ký thao tác vận hành của Staff.
     * Sử dụng Propagation.REQUIRES_NEW để việc lưu audit log độc lập với transaction chính khi cần.
     */
    @Transactional(propagation = Propagation.REQUIRED)
    public StaffAuditLog logAction(Long actorUserId, String actorEmail, StaffAuditAction action,
                                   String targetType, Long targetId, Long spaceId, String details) {
        StaffAuditLog auditLog = StaffAuditLog.builder()
                .actorUserId(actorUserId != null ? actorUserId : 0L)
                .actorEmail(actorEmail)
                .action(action)
                .targetType(targetType)
                .targetId(targetId)
                .spaceId(spaceId)
                .details(details)
                .build();

        StaffAuditLog saved = staffAuditLogRepository.save(auditLog);
        log.info("[StaffAudit] {} thực hiện [{}] trên {} #{} (Space #{})",
                actorEmail, action, targetType, targetId, spaceId);
        return saved;
    }

    @Transactional(readOnly = true)
    public List<StaffAuditLogResponseKT> getAuditLogs(String actionStr, String targetType, Long targetId, Long spaceId) {
        List<StaffAuditLog> list;
        StaffAuditAction action = null;
        if (actionStr != null && !actionStr.isBlank()) {
            try {
                action = StaffAuditAction.valueOf(actionStr.trim().toUpperCase());
            } catch (IllegalArgumentException ignored) {
            }
        }

        if (action != null) {
            list = staffAuditLogRepository.findByActionOrderByCreatedAtDesc(action);
        } else if (targetType != null && targetId != null) {
            list = staffAuditLogRepository.findByTargetTypeAndTargetIdOrderByCreatedAtDesc(targetType, targetId);
        } else if (spaceId != null) {
            list = staffAuditLogRepository.findBySpaceIdOrderByCreatedAtDesc(spaceId);
        } else {
            list = staffAuditLogRepository.findAllByOrderByCreatedAtDesc();
        }

        return list.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public StaffAuditLogResponseKT toResponse(StaffAuditLog entity) {
        return StaffAuditLogResponseKT.builder()
                .id(entity.getId())
                .actorUserId(entity.getActorUserId())
                .actorEmail(entity.getActorEmail())
                .action(entity.getAction())
                .actionDescription(entity.getAction().getDescription())
                .targetType(entity.getTargetType())
                .targetId(entity.getTargetId())
                .spaceId(entity.getSpaceId())
                .details(entity.getDetails())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
