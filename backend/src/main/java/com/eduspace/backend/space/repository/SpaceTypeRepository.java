package com.eduspace.backend.space.repository;

import com.eduspace.backend.space.entity.SpaceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SpaceTypeRepository extends JpaRepository<SpaceType, Long> {
    Optional<SpaceType> findByIdAndDeletedAtIsNull(Long id);
    List<SpaceType> findAllByDeletedAtIsNull();
    boolean existsByNameIgnoreCase(String name);
}
