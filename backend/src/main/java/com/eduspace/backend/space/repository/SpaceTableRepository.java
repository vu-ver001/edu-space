package com.eduspace.backend.space.repository;

import com.eduspace.backend.space.entity.SpaceTable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SpaceTableRepository extends JpaRepository<SpaceTable, Long> {

    Optional<SpaceTable> findByIdAndDeletedAtIsNull(Long id);

    List<SpaceTable> findBySpaceIdAndDeletedAtIsNull(Long spaceId);

    long countBySpaceIdAndDeletedAtIsNull(Long spaceId);

    boolean existsBySpaceIdAndTableCodeIgnoreCase(Long spaceId, String tableCode);

    long countByStatusAndDeletedAtIsNull(com.eduspace.backend.space.entity.SpaceTableStatus status);

    @Query("SELECT COALESCE(SUM(t.capacity), 0) FROM SpaceTable t WHERE t.space.id = :spaceId AND t.deletedAt IS NULL")
    Integer sumActiveCapacityBySpaceId(@Param("spaceId") Long spaceId);
}
