package com.eduspace.backend.booking.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

import com.eduspace.backend.booking.entity.BookingAuditLog;




@Repository
public interface BookingAuditLogRepository extends JpaRepository<BookingAuditLog, Long> {

    @Query("SELECT bal FROM BookingAuditLog bal LEFT JOIN FETCH bal.performedBy " +
           "WHERE bal.bookingId = :bookingId ORDER BY bal.performedAt DESC")
    List<BookingAuditLog> findByBookingIdOrderByPerformedAtDesc(@Param("bookingId") Long bookingId);
}
