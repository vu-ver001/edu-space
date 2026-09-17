package com.eduspace.backend.booking.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import com.eduspace.backend.booking.entity.Booking;
import com.eduspace.backend.booking.entity.BookingStatus;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM Booking b WHERE b.id = :id")
    Optional<Booking> findByIdForUpdate(@Param("id") Long id);

    @Query("SELECT b.id FROM Booking b WHERE b.status = com.eduspace.backend.booking.entity.BookingStatus.CONFIRMED AND b.startTime < :threshold ORDER BY b.id")
    List<Long> findNoShowCandidateIds(@Param("threshold") LocalDateTime threshold);

    default Optional<Booking> findByIdWithDetails(Long id) {
        return findById(id);
    }

    /**
     * Tìm các booking đang chiếm chỗ của một phòng giao nhau với khoảng thời gian [startTime, endTime].
     * Nhóm chiếm chỗ: PENDING_APPROVAL, CONFIRMED, CHECKED_IN
     */
    @Query("SELECT b FROM Booking b WHERE b.spaceId = :spaceId " +
           "AND b.status IN :statuses " +
           "AND b.startTime < :endTime AND b.endTime > :startTime")
    List<Booking> findOverlappingSpaceBookings(
            @Param("spaceId") Long spaceId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("statuses") Collection<BookingStatus> statuses
    );

    /**
     * Tìm các booking đang chiếm chỗ của phòng, loại trừ chính booking đang xét (dùng khi Staff duyệt lại).
     */
    @Query("SELECT b FROM Booking b WHERE b.spaceId = :spaceId " +
           "AND b.id <> :excludeBookingId " +
           "AND b.status IN :statuses " +
           "AND b.startTime < :endTime AND b.endTime > :startTime")
    List<Booking> findOverlappingSpaceBookingsExcluding(
            @Param("spaceId") Long spaceId,
            @Param("excludeBookingId") Long excludeBookingId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("statuses") Collection<BookingStatus> statuses
    );

    /**
     * Tìm các booking đang chiếm chỗ của chính sinh viên đó giao nhau với khoảng thời gian.
     */
    @Query("SELECT b FROM Booking b WHERE b.studentId = :studentId " +
           "AND b.status IN :statuses " +
           "AND b.startTime < :endTime AND b.endTime > :startTime")
    List<Booking> findOverlappingStudentBookings(
            @Param("studentId") Long studentId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("statuses") Collection<BookingStatus> statuses
    );

    /**
     * Đếm số lượt booking đang chiếm chỗ của sinh viên trong một ngày cụ thể (Quota/ngày).
     */
    @Query("SELECT COUNT(b) FROM Booking b WHERE b.studentId = :studentId " +
           "AND b.startTime >= :dayStart AND b.startTime < :dayEnd " +
           "AND b.status IN :statuses")
    long countOccupyingBookingsForStudentOnDate(
            @Param("studentId") Long studentId,
            @Param("dayStart") LocalDateTime dayStart,
            @Param("dayEnd") LocalDateTime dayEnd,
            @Param("statuses") Collection<BookingStatus> statuses
    );

    /**
     * Đếm số lượt tạo booking của sinh viên trong 1 giờ qua (Rate-limit).
     */
    @Query("SELECT COUNT(b) FROM Booking b WHERE b.studentId = :studentId " +
           "AND b.createdAt >= :oneHourAgo")
    long countRecentBookingsCreated(
            @Param("studentId") Long studentId,
            @Param("oneHourAgo") LocalDateTime oneHourAgo
    );

    /**
     * Lấy danh sách booking của một sinh viên (My bookings).
     */
    List<Booking> findByStudentIdOrderByStartTimeDesc(Long studentId);

    List<Booking> findByStudentIdAndStatusOrderByStartTimeDesc(Long studentId, BookingStatus status);

    /**
     * Lấy các booking PENDING_APPROVAL đã quá giờ bắt đầu mà chưa xử lý (để chuyển EXPIRED).
     */
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM Booking b WHERE b.status = :status AND b.startTime <= :now ORDER BY b.id")
    List<Booking> findPendingOverdueBookings(
            @Param("status") BookingStatus status,
            @Param("now") LocalDateTime now
    );

    /**
     * Lấy các booking PENDING_APPROVAL cho một sinh viên cụ thể đã quá giờ (để chạy expire trước khi tính quota).
     */
    @Query("SELECT b FROM Booking b WHERE b.studentId = :studentId " +
           "AND b.status = :status AND b.startTime <= :now")
    List<Booking> findStudentPendingOverdueBookings(
            @Param("studentId") Long studentId,
            @Param("status") BookingStatus status,
            @Param("now") LocalDateTime now
    );

    /**
     * Lấy tất cả booking PENDING_APPROVAL còn hiệu lực (chưa quá giờ) cho Staff duyệt.
     */
    @Query("SELECT b FROM Booking b WHERE b.status = :status AND b.startTime > :now ORDER BY b.createdAt ASC")
    List<Booking> findActivePendingBookings(
            @Param("status") BookingStatus status,
            @Param("now") LocalDateTime now
    );

    /**
     * Lấy các booking CONFIRMED đã quá hạn check-in (để chuyển NO_SHOW).
     */
    @Query("SELECT b FROM Booking b WHERE b.status = :status AND b.startTime < :checkInDeadlineThreshold")
    List<Booking> findConfirmedNoShowBookings(
            @Param("status") BookingStatus status,
            @Param("checkInDeadlineThreshold") LocalDateTime checkInDeadlineThreshold
    );

    /**
     * Lấy các booking CHECKED_IN đã qua endTime (để chuyển COMPLETED).
     */
    @Query("SELECT b FROM Booking b WHERE b.status = :status AND b.endTime <= :now")
    List<Booking> findCompletedCandidateBookings(
            @Param("status") BookingStatus status,
            @Param("now") LocalDateTime now
    );

    /**
     * Lấy danh sách booking của một phòng trong khoảng thời gian cụ thể (dành cho hiển thị Space Timeline).
     */
    @Query("SELECT b FROM Booking b WHERE b.spaceId = :spaceId " +
           "AND b.status IN :statuses " +
           "AND b.startTime < :toTime AND b.endTime > :fromTime " +
           "ORDER BY b.startTime ASC")
    List<Booking> findTimelineBookings(
            @Param("spaceId") Long spaceId,
            @Param("fromTime") LocalDateTime fromTime,
            @Param("toTime") LocalDateTime toTime,
            @Param("statuses") Collection<BookingStatus> statuses
    );
}
