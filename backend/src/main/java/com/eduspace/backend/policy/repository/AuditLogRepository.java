package com.eduspace.backend.policy.repository;

import com.eduspace.backend.policy.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findByTargetTypeOrderByPerformedAtDesc(String targetType);

    List<AuditLog> findAllByOrderByPerformedAtDesc();
}
