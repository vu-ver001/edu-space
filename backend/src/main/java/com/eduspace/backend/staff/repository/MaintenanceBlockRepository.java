package com.eduspace.backend.staff.repository;

import com.eduspace.backend.space.entity.MaintenanceBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface MaintenanceBlockRepository extends JpaRepository<MaintenanceBlock, Long> {

    Optional<MaintenanceBlock> findByIdAndDeletedAtIsNull(Long id);

    List<MaintenanceBlock> findBySpaceIdAndDeletedAtIsNullOrderByStartTimeAsc(Long spaceId);

    /**
     * Tìm các khoảng bảo trì đang hoạt động của một không gian giao nhau với [startTime, endTime].
     * Điều kiện giao nhau: m.startTime < endTime AND m.endTime > startTime.
     */
    @Query("SELECT m FROM MaintenanceBlock m WHERE m.space.id = :spaceId " +
           "AND m.deletedAt IS NULL " +
           "AND m.startTime < :endTime AND m.endTime > :startTime " +
           "ORDER BY m.startTime ASC")
    List<MaintenanceBlock> findOverlappingBlocks(
            @Param("spaceId") Long spaceId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );

    /**
     * Tìm các khoảng bảo trì giao nhau với khoảng thời gian, loại trừ một block đang cập nhật.
     */
    @Query("SELECT m FROM MaintenanceBlock m WHERE m.space.id = :spaceId " +
           "AND m.id <> :excludeId " +
           "AND m.deletedAt IS NULL " +
           "AND m.startTime < :endTime AND m.endTime > :startTime " +
           "ORDER BY m.startTime ASC")
    List<MaintenanceBlock> findOverlappingBlocksExcluding(
            @Param("spaceId") Long spaceId,
            @Param("excludeId") Long excludeId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );

    /**
     * Tìm các khoảng bảo trì đang active của không gian trong một khoảng thời gian (dành cho timeline).
     */
    @Query("SELECT m FROM MaintenanceBlock m WHERE m.space.id = :spaceId " +
           "AND m.deletedAt IS NULL " +
           "AND m.startTime < :toTime AND m.endTime > :fromTime " +
           "ORDER BY m.startTime ASC")
    List<MaintenanceBlock> findActiveBlocksInPeriod(
            @Param("spaceId") Long spaceId,
            @Param("fromTime") LocalDateTime fromTime,
            @Param("toTime") LocalDateTime toTime
    );

    /**
     * Kiểm tra nhanh xem không gian có bất kỳ khoảng bảo trì nào giao với [startTime, endTime] hay không.
     */
    default boolean hasOverlappingMaintenance(Long spaceId, LocalDateTime startTime, LocalDateTime endTime) {
        return !findOverlappingBlocks(spaceId, startTime, endTime).isEmpty();
    }
}
