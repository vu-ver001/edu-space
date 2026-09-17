package com.eduspace.backend.booking.repository;

import com.eduspace.backend.booking.entity.Booking;
import com.eduspace.backend.booking.entity.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    long countByCreatedAtBetween(LocalDateTime from, LocalDateTime to);

    long countByStatusAndCreatedAtBetween(BookingStatus status, LocalDateTime from, LocalDateTime to);

    long countByStatus(BookingStatus status);
}
