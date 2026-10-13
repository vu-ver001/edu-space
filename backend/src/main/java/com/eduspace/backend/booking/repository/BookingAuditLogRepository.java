package com.eduspace.backend.booking.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

import com.eduspace.backend.booking.entity.BookingAuditLog;




// Repository quản lý truy vấn nhật ký kiểm toán (Audit Log) cho các thao tác đặt phòng (Khánh Vân).
@Repository
public interface BookingAuditLogRepository extends JpaRepository<BookingAuditLog, Long> {

    // Tra cứu toàn bộ lịch sử thao tác của một đơn đặt chỗ, sắp xếp thời gian mới nhất lên đầu.
    @Query("SELECT bal FROM BookingAuditLog bal WHERE bal.bookingId = :bookingId ORDER BY bal.performedAt DESC")
    List<BookingAuditLog> findByBookingIdOrderByPerformedAtDesc(@Param("bookingId") Long bookingId);
}
