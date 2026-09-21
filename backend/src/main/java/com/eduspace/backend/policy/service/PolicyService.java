package com.eduspace.backend.policy.service;

import com.eduspace.backend.policy.entity.BookingPolicy;
import com.eduspace.backend.policy.repository.BookingPolicyRepository;
import com.eduspace.backend.common.exception.BusinessException;
import com.eduspace.backend.policy.dto.request.PolicyUpdateRequest;
import com.eduspace.backend.policy.dto.response.*;
import com.eduspace.backend.policy.entity.AuditLog;
import com.eduspace.backend.policy.repository.AuditLogRepository;
import jakarta.validation.Validator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;

/** Single policy source: the existing booking_policies key/value table. */
@Service
@RequiredArgsConstructor
public class PolicyService {
    private final BookingPolicyRepository policies;
    private final AuditLogRepository audits;
    private final Validator validator;

    @Transactional(readOnly = true)
    public long getLong(String key, long fallback) {
        return policies.findByPolicyKey(key).map(p -> parse(p.getPolicyValue())).orElse(fallback);
    }

    private long parse(String value) {
        if (value == null || value.isBlank()) {
            return 0L;
        }
        try {
            long parsed = Long.parseLong(value.trim());
            if (parsed < 0) return 0L;
            return parsed;
        } catch (NumberFormatException ex) {
            return 0L;
        }
    }

    @Transactional(readOnly = true)
    public PolicyResponse getPolicy() { return getCurrentPolicy(); }

    @Transactional(readOnly = true)
    public PolicyResponse getCurrentPolicy() {
        Map<String, Long> values = new HashMap<>();
        Map<String, String> stringValues = new HashMap<>();
        var rows = policies.findAll();
        rows.forEach(p -> {
            if (p.getPolicyKey() != null && !p.getPolicyKey().isBlank()) {
                values.put(p.getPolicyKey(), parse(p.getPolicyValue()));
                stringValues.put(p.getPolicyKey(), p.getPolicyValue());
            }
        });
        int grace = Math.toIntExact(values.getOrDefault("CHECKIN_GRACE_MINUTES", 15L));
        var latest = rows.stream().filter(p -> p.getUpdatedAt() != null)
                .max(Comparator.comparing(BookingPolicy::getUpdatedAt));
        return PolicyResponse.builder().id(1L)
                .maxBookingsPerDay(Math.toIntExact(values.getOrDefault("DAILY_BOOKING_QUOTA", 2L)))
                .maxDurationMinutes(Math.toIntExact(values.getOrDefault("MAX_DURATION_MINUTES",
                        values.getOrDefault("MAX_BOOKING_HOURS_PER_SLOT", 3L) * 60)))
                .maxRequestRatePerHour(Math.toIntExact(values.getOrDefault("RATE_LIMIT_HOURLY", 10L)))
                .checkInEarlyOpenMinutes(Math.toIntExact(values.getOrDefault("CHECKIN_OPEN_MINUTES", 15L)))
                .checkInGraceMinutes(grace).checkInCloseOffsetMinutes(grace)
                .openingHour(stringValues.getOrDefault("OPENING_HOUR", "07:00"))
                .closingHour(stringValues.getOrDefault("CLOSING_HOUR", "22:00"))
                .updatedAt(latest.map(BookingPolicy::getUpdatedAt).orElse(null))
                .updatedBy(latest.map(BookingPolicy::getUpdatedBy).orElse(null)).build();
    }

    @Transactional
    public PolicyResponse updatePolicy(PolicyUpdateRequest request, String actor) {
        if (!validator.validate(request).isEmpty()
                || (request.getCheckInCloseOffsetMinutes() != null
                    && !request.getCheckInCloseOffsetMinutes().equals(request.getCheckInGraceMinutes()))) {
            throw BusinessException.badRequest("INVALID_POLICY_CONFIGURATION", "Cấu hình policy không hợp lệ; mốc đóng phải bằng thời gian ân hạn.");
        }
        if (request.getOpeningHour() != null && request.getClosingHour() != null) {
            if (request.getOpeningHour().compareTo(request.getClosingHour()) >= 0) {
                throw BusinessException.badRequest("INVALID_POLICY_CONFIGURATION", "Giờ mở cửa phải trước giờ đóng cửa.");
            }
        }
        // Existing rows are locked in a consistent order for concurrent administrator edits.
        policies.lockAll();
        String before = formatPolicySummary(getCurrentPolicy());
        Map<String, String> updates = new TreeMap<>();
        updates.put("DAILY_BOOKING_QUOTA", String.valueOf(request.getMaxBookingsPerDay()));
        updates.put("MAX_DURATION_MINUTES", String.valueOf(request.getMaxDurationMinutes()));
        updates.put("RATE_LIMIT_HOURLY", String.valueOf(request.getMaxRequestRatePerHour()));
        updates.put("CHECKIN_OPEN_MINUTES", String.valueOf(request.getCheckInEarlyOpenMinutes()));
        updates.put("CHECKIN_GRACE_MINUTES", String.valueOf(request.getCheckInGraceMinutes()));
        if (request.getOpeningHour() != null && !request.getOpeningHour().isBlank()) {
            updates.put("OPENING_HOUR", request.getOpeningHour().trim());
        }
        if (request.getClosingHour() != null && !request.getClosingHour().isBlank()) {
            updates.put("CLOSING_HOUR", request.getClosingHour().trim());
        }
        LocalDateTime now = LocalDateTime.now();
        updates.forEach((key, value) -> {
            BookingPolicy row = policies.findByPolicyKey(key)
                    .orElseGet(() -> BookingPolicy.builder().policyKey(key).build());
            row.setPolicyValue(value);
            row.setUpdatedAt(now);
            row.setUpdatedBy(actor);
            policies.save(row);
        });
        PolicyResponse result = getCurrentPolicy();
        String after = formatPolicySummary(result);
        audits.save(new AuditLog("UPDATE_POLICY", "POLICY", "1", before, after, actor));
        return result;
    }

    private String formatPolicySummary(PolicyResponse p) {
        if (p == null) return "";
        return String.format(
            "Khung giờ: %s - %s | Thời lượng tối đa: %d giờ | Hạn mức: %d lượt/ngày | Check-in: trước %dp, ân hạn %dp",
            p.getOpeningHour() != null ? p.getOpeningHour() : "07:00",
            p.getClosingHour() != null ? p.getClosingHour() : "22:00",
            (p.getMaxDurationMinutes() != null ? p.getMaxDurationMinutes() : 180) / 60,
            p.getMaxBookingsPerDay() != null ? p.getMaxBookingsPerDay() : 2,
            p.getCheckInEarlyOpenMinutes() != null ? p.getCheckInEarlyOpenMinutes() : 15,
            p.getCheckInGraceMinutes() != null ? p.getCheckInGraceMinutes() : 15
        );
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> getPolicyAuditLogs() {
        return audits.findByTargetTypeOrderByPerformedAtDesc("POLICY").stream().map(a ->
                AuditLogResponse.builder().id(a.getId()).action(a.getAction())
                        .targetType(a.getTargetType()).targetId(a.getTargetId())
                        .oldValue(a.getOldValue()).newValue(a.getNewValue())
                        .performedBy(a.getPerformedBy()).performedAt(a.getPerformedAt()).build()).toList();
    }
}
