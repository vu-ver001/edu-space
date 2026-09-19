package com.eduspace.backend.staff.repository;

import com.eduspace.backend.staff.entity.StaffAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StaffAuditLogRepository extends JpaRepository<StaffAuditLog, Long> {

    List<StaffAuditLog> findByTargetTypeAndTargetIdOrderByCreatedAtDesc(String targetType, Long targetId);

    List<StaffAuditLog> findBySpaceIdOrderByCreatedAtDesc(Long spaceId);

    List<StaffAuditLog> findByActionOrderByCreatedAtDesc(com.eduspace.backend.staff.entity.StaffAuditAction action);

    List<StaffAuditLog> findAllByOrderByCreatedAtDesc();
}
