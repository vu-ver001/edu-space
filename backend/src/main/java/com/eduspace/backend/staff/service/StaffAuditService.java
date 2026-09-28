package com.eduspace.backend.staff.service;

import com.eduspace.backend.auth.entity.User;
import com.eduspace.backend.auth.repository.UserRepository;
import com.eduspace.backend.auth.security.SecurityUtils;
import com.eduspace.backend.space.entity.Space;
import com.eduspace.backend.space.repository.SpaceRepository;
import com.eduspace.backend.staff.dto.response.StaffAuditLogPageResponseKT;
import com.eduspace.backend.staff.dto.response.StaffAuditLogResponseKT;
import com.eduspace.backend.staff.dto.response.StaffAuditStatsResponseKT;
import com.eduspace.backend.staff.entity.StaffAuditAction;
import com.eduspace.backend.staff.entity.StaffAuditLog;
import com.eduspace.backend.staff.repository.StaffAuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class StaffAuditService {

    private final StaffAuditLogRepository staffAuditLogRepository;
    private final UserRepository userRepository;
    private final SpaceRepository spaceRepository;

    /**
     * Ghi nhận nhật ký thao tác vận hành của Staff.
     * Sử dụng Propagation.REQUIRED để việc lưu audit log độc lập với transaction chính khi cần.
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
        StaffAuditAction action = parseAction(actionStr);

        if (action != null) {
            list = staffAuditLogRepository.findByActionOrderByCreatedAtDesc(action);
        } else if (targetType != null && targetId != null) {
            list = staffAuditLogRepository.findByTargetTypeAndTargetIdOrderByCreatedAtDesc(targetType, targetId);
        } else if (spaceId != null) {
            list = staffAuditLogRepository.findBySpaceIdOrderByCreatedAtDesc(spaceId);
        } else {
            list = staffAuditLogRepository.findAllByOrderByCreatedAtDesc();
        }

        return enrich(list);
    }

    /**
     * Tìm kiếm audit-log chuẩn nghiệp vụ cho trang AuditLog/Timeline:
     * lọc theo action, targetType, targetId, spaceId/spaceName, actorUserId, khoảng ngày from-to,
     * tự scope STAFF chỉ thấy log của chính mình, có phân trang thủ công.
     */
    @Transactional(readOnly = true)
    public StaffAuditLogPageResponseKT searchAuditLogs(String actionStr, String targetType, Long targetId,
                                                       Long spaceId, String spaceName, Long actorUserId,
                                                       String fromStr, String toStr, Integer page, Integer size) {
        Long effectiveActorId = resolveActorScope(actorUserId);
        StaffAuditAction action = parseAction(actionStr);
        LocalDateTime from = parseFrom(fromStr);
        LocalDateTime to = parseTo(toStr);

        List<StaffAuditLog> filtered = staffAuditLogRepository.search(
                action,
                blankToNull(targetType),
                targetId,
                spaceId,
                effectiveActorId,
                from,
                to);

        // Lọc thêm theo tên không gian (frontend gửi spaceName, backend chỉ lưu spaceId).
        Set<Long> spaceIdAllowlist = resolveSpaceIds(spaceName);
        if (spaceIdAllowlist != null) {
            if (spaceIdAllowlist.isEmpty()) {
                filtered = List.of();
            } else {
                filtered = filtered.stream()
                        .filter(log -> log.getSpaceId() != null && spaceIdAllowlist.contains(log.getSpaceId()))
                        .collect(Collectors.toList());
            }
        }

        int pageIndex = (page == null || page < 0) ? 0 : page;
        int pageSize = (size == null || size <= 0) ? 10 : Math.min(size, 100);
        int total = filtered.size();
        int totalPages = Math.max(1, (int) Math.ceil((double) total / pageSize));
        int fromIndex = Math.min(pageIndex * pageSize, total);
        int toIndex = Math.min(fromIndex + pageSize, total);

        List<StaffAuditLogResponseKT> content = enrich(filtered.subList(fromIndex, toIndex));

        return StaffAuditLogPageResponseKT.builder()
                .content(content)
                .page(pageIndex)
                .size(pageSize)
                .totalElements(total)
                .totalPages(totalPages)
                .build();
    }

    @Transactional(readOnly = true)
    public StaffAuditStatsResponseKT getAuditStats(String actionStr, String targetType, Long targetId,
                                                  Long spaceId, String spaceName, Long actorUserId,
                                                  String fromStr, String toStr) {
        StaffAuditLogPageResponseKT all = searchAuditLogs(
                actionStr, targetType, targetId, spaceId, spaceName, actorUserId, fromStr, toStr, 0, 10000);
        List<StaffAuditLogResponseKT> logs = all.getContent();

        long approved = logs.stream().filter(l -> l.getAction() == StaffAuditAction.BOOKING_APPROVED).count();
        long rejected = logs.stream().filter(l -> l.getAction() == StaffAuditAction.BOOKING_REJECTED).count();
        long checkIn = logs.stream().filter(l -> l.getAction() == StaffAuditAction.STAFF_CHECKED_IN_BOOKING).count();
        long maintenance = logs.stream().filter(l -> l.getAction() == StaffAuditAction.MAINTENANCE_CREATED
                || l.getAction() == StaffAuditAction.MAINTENANCE_UPDATED
                || l.getAction() == StaffAuditAction.MAINTENANCE_CANCELLED).count();

        return StaffAuditStatsResponseKT.builder()
                .totalActions(all.getTotalElements())
                .approvedCount(approved)
                .rejectedCount(rejected)
                .checkInCount(checkIn)
                .maintenanceCount(maintenance)
                .build();
    }

    /**
     * STAFF chỉ được thấy log của chính mình (enforce từ JWT, không tin client).
     * ADMIN được lọc tự do theo actorUserId.
     */
    private Long resolveActorScope(Long requestedActorId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        boolean isAdmin = SecurityUtils.hasRole("ADMIN");
        if (!isAdmin && currentUserId != null) {
            return currentUserId;
        }
        return requestedActorId;
    }

    private Set<Long> resolveSpaceIds(String spaceName) {
        if (spaceName == null || spaceName.isBlank()) {
            return null;
        }
        String keyword = spaceName.trim().toLowerCase();
        List<Space> spaces = spaceRepository.findAllByDeletedAtIsNull();
        Set<Long> ids = new HashSet<>();
        for (Space space : spaces) {
            if (space.getName() != null && space.getName().toLowerCase().contains(keyword)) {
                ids.add(space.getId());
            }
        }
        // Hỗ trợ cả trường hợp frontend gửi đúng "id:name" hoặc id dạng chuỗi.
        try {
            ids.add(Long.parseLong(spaceName.trim()));
        } catch (NumberFormatException ignored) {
        }
        return ids;
    }

    private StaffAuditAction parseAction(String actionStr) {
        if (actionStr == null || actionStr.isBlank()) {
            return null;
        }
        try {
            return StaffAuditAction.valueOf(actionStr.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            // Tương thích tên cũ từ frontend mock: STAFF_CHECK_IN -> STAFF_CHECKED_IN_BOOKING
            String normalized = actionStr.trim().toUpperCase();
            if ("STAFF_CHECK_IN".equals(normalized)) {
                return StaffAuditAction.STAFF_CHECKED_IN_BOOKING;
            }
            if ("MAINTENANCE_DELETED".equals(normalized)) {
                return StaffAuditAction.MAINTENANCE_CANCELLED;
            }
            return null;
        }
    }

    private LocalDateTime parseFrom(String fromStr) {
        if (fromStr == null || fromStr.isBlank()) {
            return null;
        }
        String value = fromStr.trim();
        try {
            return LocalDateTime.parse(value);
        } catch (DateTimeParseException ignored) {
        }
        try {
            return LocalDate.parse(value.substring(0, 10)).atStartOfDay();
        } catch (DateTimeParseException | StringIndexOutOfBoundsException ex) {
            return null;
        }
    }

    private LocalDateTime parseTo(String toStr) {
        if (toStr == null || toStr.isBlank()) {
            return null;
        }
        String value = toStr.trim();
        try {
            return LocalDateTime.parse(value);
        } catch (DateTimeParseException ignored) {
        }
        try {
            return LocalDate.parse(value.substring(0, 10)).atTime(23, 59, 59);
        } catch (DateTimeParseException | StringIndexOutOfBoundsException ex) {
            return null;
        }
    }

    private String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }

    private List<StaffAuditLogResponseKT> enrich(List<StaffAuditLog> entities) {
        if (entities == null || entities.isEmpty()) {
            return List.of();
        }
        Set<Long> userIds = entities.stream()
                .map(StaffAuditLog::getActorUserId)
                .filter(id -> id != null && id > 0)
                .collect(Collectors.toSet());
        Set<Long> spaceIds = entities.stream()
                .map(StaffAuditLog::getSpaceId)
                .filter(id -> id != null)
                .collect(Collectors.toSet());

        Map<Long, User> userMap = new HashMap<>();
        if (!userIds.isEmpty()) {
            userRepository.findAllById(userIds).forEach(user -> userMap.put(user.getId(), user));
        }
        Map<Long, String> spaceNameMap = new HashMap<>();
        if (!spaceIds.isEmpty()) {
            spaceRepository.findAllById(spaceIds).forEach(space -> spaceNameMap.put(space.getId(), space.getName()));
        }

        return entities.stream().map(entity -> toResponse(entity, userMap, spaceNameMap)).collect(Collectors.toList());
    }

    public StaffAuditLogResponseKT toResponse(StaffAuditLog entity) {
        return toResponse(entity, Map.of(), Map.of());
    }

    private StaffAuditLogResponseKT toResponse(StaffAuditLog entity, Map<Long, User> userMap, Map<Long, String> spaceNameMap) {
        User actor = entity.getActorUserId() != null ? userMap.get(entity.getActorUserId()) : null;
        String actorName = actor != null && actor.getFullName() != null && !actor.getFullName().isBlank()
                ? actor.getFullName()
                : entity.getActorEmail();
        String actorRole = actor != null && actor.getRole() != null ? actor.getRole().name() : "STAFF";
        String spaceName = entity.getSpaceId() != null ? spaceNameMap.get(entity.getSpaceId()) : null;

        return StaffAuditLogResponseKT.builder()
                .id(entity.getId())
                .actorUserId(entity.getActorUserId())
                .actorEmail(entity.getActorEmail())
                .actorName(actorName)
                .actorRole(actorRole)
                .action(entity.getAction())
                .actionDescription(entity.getAction() != null ? entity.getAction().getDescription() : null)
                .targetType(entity.getTargetType())
                .targetId(entity.getTargetId())
                .targetLabel(buildTargetLabel(entity.getTargetType(), entity.getTargetId()))
                .spaceId(entity.getSpaceId())
                .spaceName(spaceName)
                .details(entity.getDetails())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    private String buildTargetLabel(String targetType, Long targetId) {
        if (targetType == null || targetId == null) {
            return null;
        }
        return switch (targetType.trim().toUpperCase()) {
            case "BOOKING" -> "Booking #" + targetId;
            case "MAINTENANCE" -> "Bảo trì #" + targetId;
            case "STUDENT" -> "Sinh viên #" + targetId;
            case "SPACE" -> "Không gian #" + targetId;
            default -> targetType + " #" + targetId;
        };
    }
}
