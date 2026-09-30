package com.eduspace.backend.booking.repository;

import com.eduspace.backend.space.entity.MaintenanceBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository tra cứu lịch bảo trì phục vụ module Đặt chỗ (Khánh Vân).
 */
@Repository
public interface BookingMaintenanceRepository extends JpaRepository<MaintenanceBlock, Long> {

    @Query("SELECT m FROM MaintenanceBlock m WHERE m.space.id = :spaceId " +
           "AND m.deletedAt IS NULL " +
           "AND m.endTime >= :now " +
           "ORDER BY m.startTime ASC")
    List<MaintenanceBlock> findUpcomingBlocks(
            @Param("spaceId") Long spaceId,
            @Param("now") LocalDateTime now
    );

    @Query("SELECT m FROM MaintenanceBlock m WHERE m.space.id = :spaceId " +
           "AND m.deletedAt IS NULL " +
           "AND m.startTime < :endTime AND m.endTime > :startTime")
    List<MaintenanceBlock> findOverlappingBlocks(
            @Param("spaceId") Long spaceId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );

    @Query("SELECT m FROM MaintenanceBlock m JOIN FETCH m.space " +
           "WHERE m.deletedAt IS NULL " +
           "AND m.endTime >= :now " +
           "ORDER BY m.startTime ASC")
    List<MaintenanceBlock> findAllUpcomingBlocks(@Param("now") LocalDateTime now);
}
