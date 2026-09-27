package com.eduspace.backend.staff.repository;

import com.eduspace.backend.staff.entity.StaffAuditAction;
import com.eduspace.backend.staff.entity.StaffAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface StaffAuditLogRepository extends JpaRepository<StaffAuditLog, Long> {

    List<StaffAuditLog> findByTargetTypeAndTargetIdOrderByCreatedAtDesc(String targetType, Long targetId);

    List<StaffAuditLog> findBySpaceIdOrderByCreatedAtDesc(Long spaceId);

    List<StaffAuditLog> findByActionOrderByCreatedAtDesc(StaffAuditAction action);

    List<StaffAuditLog> findAllByOrderByCreatedAtDesc();

    @Query("SELECT s FROM StaffAuditLog s " +
            "WHERE (:action IS NULL OR s.action = :action) " +
            "AND (:targetType IS NULL OR s.targetType = :targetType) " +
            "AND (:targetId IS NULL OR s.targetId = :targetId) " +
            "AND (:spaceId IS NULL OR s.spaceId = :spaceId) " +
            "AND (:actorUserId IS NULL OR s.actorUserId = :actorUserId) " +
            "AND (:from IS NULL OR s.createdAt >= :from) " +
            "AND (:to IS NULL OR s.createdAt <= :to) " +
            "ORDER BY s.createdAt DESC")
    List<StaffAuditLog> search(
            @Param("action") StaffAuditAction action,
            @Param("targetType") String targetType,
            @Param("targetId") Long targetId,
            @Param("spaceId") Long spaceId,
            @Param("actorUserId") Long actorUserId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);
}
