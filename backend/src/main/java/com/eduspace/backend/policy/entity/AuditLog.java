package com.eduspace.backend.policy.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Loại hành động: UPDATE_POLICY, APPROVE_BOOKING, CANCEL_BOOKING,...
    @Column(nullable = false, length = 100)
    private String action;

    // Loại tài nguyên bị tác động: POLICY, BOOKING, SPACE,...
    @Column(name = "target_type", nullable = false, length = 50)
    private String targetType;

    // ID của tài nguyên bị tác động
    @Column(name = "target_id", length = 100)
    private String targetId;

    // Giá trị cũ dạng chuỗi hoặc JSON
    @Column(name = "old_value", columnDefinition = "TEXT")
    private String oldValue;

    // Giá trị mới dạng chuỗi hoặc JSON
    @Column(name = "new_value", columnDefinition = "TEXT")
    private String newValue;

    // Người thực hiện (email hoặc username)
    @Column(name = "performed_by", nullable = false, length = 150)
    private String performedBy;

    // Thời điểm thực hiện
    @Column(name = "performed_at", nullable = false)
    private LocalDateTime performedAt;

    public AuditLog(String action, String targetType, String targetId, String oldValue, String newValue, String performedBy) {
        this.action = action;
        this.targetType = targetType;
        this.targetId = targetId;
        this.oldValue = oldValue;
        this.newValue = newValue;
        this.performedBy = performedBy;
        this.performedAt = LocalDateTime.now();
    }
}
