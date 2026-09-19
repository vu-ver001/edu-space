package com.eduspace.backend.space.repository;

import com.eduspace.backend.space.entity.Facility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FacilityRepository extends JpaRepository<Facility, Long> {
    Optional<Facility> findByIdAndDeletedAtIsNull(Long id);
    List<Facility> findAllByDeletedAtIsNull();
    boolean existsByNameIgnoreCase(String name);
}
