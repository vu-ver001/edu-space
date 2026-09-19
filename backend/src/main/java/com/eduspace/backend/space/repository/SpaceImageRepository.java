package com.eduspace.backend.space.repository;

import com.eduspace.backend.space.entity.SpaceImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SpaceImageRepository extends JpaRepository<SpaceImage, Long> {

    List<SpaceImage> findBySpaceIdOrderBySortOrderAscIdAsc(Long spaceId);

    Optional<SpaceImage> findBySpaceIdAndIsPrimaryTrue(Long spaceId);

    List<SpaceImage> findBySpaceId(Long spaceId);

    long countBySpaceId(Long spaceId);

    void deleteBySpaceId(Long spaceId);
}
