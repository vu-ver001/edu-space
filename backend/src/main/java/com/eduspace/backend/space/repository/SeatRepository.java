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
    long countByStatusAndDeletedAtIsNull(com.eduspace.backend.space.entity.SeatStatus status);
    boolean existsBySpaceIdAndSeatCodeIgnoreCase(Long spaceId, String seatCode);

    @org.springframework.data.jpa.repository.Query("SELECT s FROM Seat s JOIN FETCH s.space WHERE s.status = :status AND s.deletedAt IS NULL")
    List<Seat> findAllByStatusWithSpace(@org.springframework.data.repository.query.Param("status") com.eduspace.backend.space.entity.SeatStatus status);
}
