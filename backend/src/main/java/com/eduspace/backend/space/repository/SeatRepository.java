package com.eduspace.backend.space.repository;

import com.eduspace.backend.space.entity.Seat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SeatRepository extends JpaRepository<Seat, Long> {
    Optional<Seat> findByIdAndDeletedAtIsNull(Long id);
    List<Seat> findBySpaceIdAndDeletedAtIsNull(Long spaceId);
    long countBySpaceIdAndDeletedAtIsNull(Long spaceId);
    boolean existsBySpaceIdAndSeatCodeIgnoreCase(Long spaceId, String seatCode);
}
