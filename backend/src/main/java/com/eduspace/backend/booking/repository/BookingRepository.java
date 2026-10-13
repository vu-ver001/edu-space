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

// Repository quản lý lưu trữ và truy vấn cốt lõi cho Động cơ Đặt chỗ EduSpace (Khánh Vân).
@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    // Khóa bi quan (PESSIMISTIC_WRITE) một đơn đặt chỗ để bảo vệ đồng thời khi cập nhật trạng thái.
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM Booking b WHERE b.id = :id")
    Optional<Booking> findByIdForUpdate(@Param("id") Long id);

    // Lấy danh sách ID các đơn CONFIRMED quá hạn check-in để scheduler đánh dấu vắng mặt (NO_SHOW).
    @Query("SELECT b.id FROM Booking b WHERE b.status = com.eduspace.backend.booking.entity.BookingStatus.CONFIRMED AND b.startTime < :threshold ORDER BY b.id")
    List<Long> findNoShowCandidateIds(@Param("threshold") LocalDateTime threshold);

    // Tra cứu đơn đặt chỗ theo ID kèm thông tin chi tiết.
    default Optional<Booking> findByIdWithDetails(Long id) {
        return findById(id);
    }

    // Đếm tổng số đơn đặt chỗ được tạo trong một khoảng thời gian cụ thể (thống kê hoặc sinh mã).
    long countByCreatedAtBetween(LocalDateTime from, LocalDateTime to);

    // Đếm số lượng đơn đặt chỗ theo trạng thái cụ thể trong một khoảng thời gian.
    long countByStatusAndCreatedAtBetween(BookingStatus status, LocalDateTime from, LocalDateTime to);

    // Tìm thời điểm tạo đơn đặt chỗ sớm nhất trong toàn hệ thống.
    @Query("SELECT MIN(b.createdAt) FROM Booking b")
    LocalDateTime findEarliestCreatedAt();

    // Tra cứu đơn đặt chỗ theo mã định danh duy nhất (ví dụ: BK-261013-0001).
    Optional<Booking> findByBookingCode(String bookingCode);

    // Kiểm tra sự tồn tại của mã đơn đặt chỗ để chống trùng lặp mã khi sinh tự động.
    boolean existsByBookingCode(String bookingCode);

    // Đếm số đơn đặt chỗ của một phòng cụ thể trong khoảng thời gian.
    long countBySpaceIdAndCreatedAtBetween(Long spaceId, LocalDateTime from, LocalDateTime to);

    // Đếm số đơn còn hiệu lực của không gian để kiểm tra điều kiện an toàn trước khi xóa phòng.
    @Query("SELECT COUNT(b) FROM Booking b WHERE b.spaceId = :spaceId " +
           "AND b.status IN :statuses AND b.endTime > :now")
    long countBlockingBookingsForSpaceDeletion(
            @Param("spaceId") Long spaceId,
            @Param("statuses") Collection<BookingStatus> statuses,
            @Param("now") LocalDateTime now
    );

    // [LÕI] Tìm các đơn đang chiếm chỗ của phòng giao thoa thời gian với khoảng [startTime, endTime].
    @Query("SELECT b FROM Booking b WHERE b.spaceId = :spaceId " +
           "AND b.status IN :statuses " +
           "AND b.startTime < :endTime AND b.endTime > :startTime")
    List<Booking> findOverlappingSpaceBookings(
            @Param("spaceId") Long spaceId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("statuses") Collection<BookingStatus> statuses
    );

    // [LÕI] Tìm các đơn đang chiếm chỗ của phòng, loại trừ chính đơn đang xét (dùng khi Staff duyệt lại).
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

    // [LÕI] Tìm các đơn đang chiếm chỗ của chính sinh viên đó giao thoa với khoảng thời gian (chống trùng lịch).
    @Query("SELECT b FROM Booking b WHERE b.studentId = :studentId " +
           "AND b.status IN :statuses " +
           "AND b.startTime < :endTime AND b.endTime > :startTime")
    List<Booking> findOverlappingStudentBookings(
            @Param("studentId") Long studentId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("statuses") Collection<BookingStatus> statuses
    );

    // [LÕI] Đếm số lượt đặt phòng đang chiếm chỗ của sinh viên trong một ngày cụ thể (Quota ngày).
    @Query("SELECT COUNT(b) FROM Booking b WHERE b.studentId = :studentId " +
           "AND b.startTime >= :dayStart AND b.startTime < :dayEnd " +
           "AND b.status IN :statuses")
    long countOccupyingBookingsForStudentOnDate(
            @Param("studentId") Long studentId,
            @Param("dayStart") LocalDateTime dayStart,
            @Param("dayEnd") LocalDateTime dayEnd,
            @Param("statuses") Collection<BookingStatus> statuses
    );

    // [LÕI] Đếm số lượt gửi yêu cầu tạo đơn của sinh viên trong 1 giờ qua (Rate-limit chống spam).
    @Query("SELECT COUNT(b) FROM Booking b WHERE b.studentId = :studentId " +
           "AND b.createdAt >= :oneHourAgo")
    long countRecentBookingsCreated(
            @Param("studentId") Long studentId,
            @Param("oneHourAgo") LocalDateTime oneHourAgo
    );

    // Lấy danh sách tất cả các đơn đặt chỗ của một sinh viên, xếp mới nhất lên đầu.
    List<Booking> findByStudentIdOrderByStartTimeDesc(Long studentId);

    // Lấy danh sách đơn của một sinh viên lọc theo trạng thái cụ thể.
    List<Booking> findByStudentIdAndStatusOrderByStartTimeDesc(Long studentId, BookingStatus status);

    // Lấy danh sách toàn bộ đơn đặt chỗ trong hệ thống cho nhân viên quản trị, mới tạo lên trước.
    List<Booking> findAllByOrderByCreatedAtDesc();

    // Lấy danh sách toàn bộ đơn đặt chỗ theo trạng thái cho nhân viên quản trị.
    List<Booking> findByStatusOrderByCreatedAtDesc(BookingStatus status);

    // Lấy các đơn PENDING_APPROVAL đã quá giờ bắt đầu để scheduler tự động chuyển sang EXPIRED.
    @Query("SELECT b FROM Booking b WHERE b.status = :status AND b.startTime <= :now ORDER BY b.id")
    List<Booking> findPendingOverdueBookings(
            @Param("status") BookingStatus status,
            @Param("now") LocalDateTime now
    );

    // Lấy các đơn PENDING_APPROVAL của một sinh viên cụ thể đã quá giờ bắt đầu.
    @Query("SELECT b FROM Booking b WHERE b.studentId = :studentId " +
           "AND b.status = :status AND b.startTime <= :now")
    List<Booking> findStudentPendingOverdueBookings(
            @Param("studentId") Long studentId,
            @Param("status") BookingStatus status,
            @Param("now") LocalDateTime now
    );

    // Lấy các đơn PENDING_APPROVAL còn hiệu lực để nhân viên xem xét phê duyệt.
    @Query("SELECT b FROM Booking b WHERE b.status = :status AND b.startTime > :now ORDER BY b.createdAt ASC")
    List<Booking> findActivePendingBookings(
            @Param("status") BookingStatus status,
            @Param("now") LocalDateTime now
    );

    // Lấy các đơn CONFIRMED đã quá hạn check-in (Grace period) để scheduler chuyển sang NO_SHOW.
    @Query("SELECT b FROM Booking b WHERE b.status = :status AND b.startTime < :checkInDeadlineThreshold")
    List<Booking> findConfirmedNoShowBookings(
            @Param("status") BookingStatus status,
            @Param("checkInDeadlineThreshold") LocalDateTime checkInDeadlineThreshold
    );

    // Lấy các đơn CHECKED_IN đã qua giờ kết thúc ca (endTime) để scheduler chuyển sang COMPLETED.
    @Query("SELECT b FROM Booking b WHERE b.status = :status AND b.endTime <= :now")
    List<Booking> findCompletedCandidateBookings(
            @Param("status") BookingStatus status,
            @Param("now") LocalDateTime now
    );

    // Lấy danh sách các đơn đặt chỗ của một phòng trong khoảng thời gian để hiển thị Space Timeline.
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

    // Đếm số đơn đang chiếm chỗ của bàn cụ thể để ngăn chặn hành vi xóa bàn đang có lịch sử dụng.
    @Query("SELECT COUNT(b) FROM Booking b WHERE b.tableId = :tableId " +
           "AND b.status IN :statuses AND b.endTime > :now")
    long countBlockingBookingsForTableDeletion(
            @Param("tableId") Long tableId,
            @Param("statuses") Collection<BookingStatus> statuses,
            @Param("now") LocalDateTime now
    );

    // Đếm số đơn đang chiếm chỗ chứa ghế cụ thể để ngăn chặn hành vi xóa ghế đang có lịch sử dụng.
    @Query("SELECT COUNT(b) FROM Booking b WHERE b.spaceId = :spaceId " +
           "AND b.status IN :statuses AND b.endTime > :now " +
           "AND b.selectedSeats LIKE CONCAT('%', :seatLabel, '%')")
    long countBlockingBookingsForSeatDeletion(
            @Param("spaceId") Long spaceId,
            @Param("seatLabel") String seatLabel,
            @Param("statuses") Collection<BookingStatus> statuses,
            @Param("now") LocalDateTime now
    );
}
