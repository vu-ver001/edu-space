package com.eduspace.backend.space.repository;

import com.eduspace.backend.space.entity.BookingMode;
import com.eduspace.backend.space.entity.Space;
import com.eduspace.backend.space.entity.SpaceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SpaceRepository extends JpaRepository<Space, Long> {

    Optional<Space> findByIdAndDeletedAtIsNull(Long id);

    List<Space> findAllByDeletedAtIsNull();

    List<Space> findAllByDeletedAtIsNullOrderByIdDesc();

    boolean existsBySpaceTypeIdAndDeletedAtIsNull(Long spaceTypeId);

    boolean existsBySpaceCodeIgnoreCaseAndDeletedAtIsNull(String spaceCode);

    boolean existsBySpaceCodeIgnoreCaseAndIdNotAndDeletedAtIsNull(String spaceCode, Long id);

    Optional<Space> findBySpaceCodeIgnoreCaseAndDeletedAtIsNull(String spaceCode);

    List<Space> findAllBySpaceTypeIdAndDeletedAtIsNull(Long spaceTypeId);

    long countByStatusAndDeletedAtIsNull(SpaceStatus status);

    default long countByStatus(SpaceStatus status) {
        return countByStatusAndDeletedAtIsNull(status);
    }

    @Query("SELECT DISTINCT s FROM Space s " +
           "LEFT JOIN s.facilities f " +
           "WHERE s.deletedAt IS NULL " +
           "AND (:spaceTypeId IS NULL OR s.spaceType.id = :spaceTypeId) " +
           "AND (:status IS NULL OR s.status = :status) " +
           "AND (:building IS NULL OR LOWER(s.building) = LOWER(:building)) " +
           "AND (:minCapacity IS NULL OR s.capacity >= :minCapacity) " +
           "AND (:facilityId IS NULL OR (f.id = :facilityId AND f.deletedAt IS NULL)) " +
           "AND (:bookingMode IS NULL OR s.spaceType.bookingMode = :bookingMode) " +
           "ORDER BY s.id DESC")
    List<Space> filterSpaces(
            @Param("spaceTypeId") Long spaceTypeId,
            @Param("status") SpaceStatus status,
            @Param("building") String building,
            @Param("minCapacity") Integer minCapacity,
            @Param("facilityId") Long facilityId,
            @Param("bookingMode") BookingMode bookingMode
    );
}
