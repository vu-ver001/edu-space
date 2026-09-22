package com.eduspace.backend.space.repository;

import com.eduspace.backend.space.entity.Facility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FacilityRepository extends JpaRepository<Facility, Long> {
    Optional<Facility> findByIdAndDeletedAtIsNull(Long id);
    List<Facility> findAllByDeletedAtIsNull();
    boolean existsByNameIgnoreCase(String name);

    @Query("SELECT COUNT(s) FROM Space s JOIN s.facilities f WHERE f.id = :facilityId AND s.deletedAt IS NULL")
    long countSpacesByFacilityId(@Param("facilityId") Long facilityId);

    @Query("SELECT f.id, COUNT(s.id) FROM Space s JOIN s.facilities f WHERE s.deletedAt IS NULL GROUP BY f.id")
    List<Object[]> countSpacesPerFacility();
}
