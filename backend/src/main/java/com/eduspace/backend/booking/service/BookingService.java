package com.eduspace.backend.booking.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import com.eduspace.backend.booking.dto.request.CreateBookingRequest;
import com.eduspace.backend.booking.dto.response.BookingAuditLogResponse;
import com.eduspace.backend.booking.dto.response.BookingResponse;
import com.eduspace.backend.booking.dto.response.ConflictDetail;
import com.eduspace.backend.booking.entity.AuditAction;
import com.eduspace.backend.booking.entity.Booking;
import com.eduspace.backend.booking.entity.BookingAuditLog;
import com.eduspace.backend.booking.entity.BookingStatus;
import com.eduspace.backend.booking.entity.StudentSchedule;
import com.eduspace.backend.booking.repository.BookingAuditLogRepository;
import com.eduspace.backend.booking.repository.BookingRepository;
import com.eduspace.backend.booking.repository.StudentScheduleRepository;
import com.eduspace.backend.common.exception.BusinessException;
import com.eduspace.backend.auth.security.SecurityUtils;
import com.eduspace.backend.auth.repository.UserRepository;
import com.eduspace.backend.auth.entity.User;
import com.eduspace.backend.space.entity.SpaceTable;
import com.eduspace.backend.space.repository.SpaceTableRepository;
/**
 * Phân hệ Quản lý Đặt chỗ Lõi (Module M04).
 * Phụ trách: Nguyễn Thị Khánh Vân (Lead kỹ thuật).
 * 
 * Hỗ trợ đầy đủ các phương thức đặt: WHOLE_SPACE, PER_SEAT, PER_TABLE.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BookingService {

    private final BookingRepository bookingRepository;
    private final BookingAuditLogRepository auditLogRepository;
    private final StudentScheduleRepository studentScheduleRepository;
    private final AvailabilityService availabilityService;
    private final SpaceTableRepository spaceTableRepository;
    private final UserRepository userRepository;
    private final java.time.Clock checkInClock;

    /**
     * API Tạo booking với 10 BƯỚC VALIDATE TUẦN TỰ BẮT BUỘC (02_Yeu_cau_logic §4.2):
     * 1. Xác thực người dùng
     * 2. Kiểm tra định dạng thời gian và giới hạn thời lượng
     * 3. Kiểm tra không gian tồn tại, trạng thái và sức chứa
     * 4. Kiểm tra bảo trì phòng
     * 5. Kiểm tra booking đang chiếm chỗ của phòng & chống trùng ghế
     * 6. Kiểm tra booking đang chiếm chỗ khác của chính sinh viên
     * 7. Kiểm tra xung đột lịch học chính khóa
     * 8. Kiểm tra quota booking trong ngày và rate-limit tạo yêu cầu
     * 9. Xác định trạng thái khởi tạo: PENDING_APPROVAL hoặc CONFIRMED
     * 10. Lưu booking, audit log và trả response
     */
    @Transactional
    public BookingResponse createBooking(CreateBookingRequest request, String userEmail) {
        LocalDateTime now = LocalDateTime.now();

        // BƯỚC 1: Xác thực người dùng
        Long studentId = resolveStudentId(userEmail);

        // BƯỚC 2: Kiểm tra định dạng thời gian & các giới hạn
        LocalDateTime startTime = request.getStartTime();
        LocalDateTime endTime = request.getEndTime();
        availabilityService.validateBookingTimeLimits(startTime, endTime);

        // BƯỚC 3: Kiểm tra phòng và sức chứa
        AvailabilityService.SpaceCatalogItem space = availabilityService.getSpaceCatalogItem(request.getSpaceId());
        if (space == null) {
            throw BusinessException.notFound("SPACE_NOT_FOUND", "Không tìm thấy phòng với ID: " + request.getSpaceId());
        }

        if (!"AVAILABLE".equalsIgnoreCase(space.getStatus())) {
            throw BusinessException.conflict("SPACE_NOT_AVAILABLE", 
                    "Phòng hiện không thể đặt do trạng thái: " + space.getStatus());
        }

        if (request.getParticipantCount() > space.getCapacity()) {
            throw BusinessException.badRequest("CAPACITY_EXCEEDED", 
                    "Số người tham gia (" + request.getParticipantCount() + ") vượt quá sức chứa của phòng (" + space.getCapacity() + ")");
        }

        // BƯỚC 4: Giải phóng pending quá hạn trước khi kiểm tra
        availabilityService.expirePendingApproval(now);

        // BƯỚC 4b: Kiểm tra loại không gian có hỗ trợ chọn chỗ ngồi hay bàn hay không
        boolean isPerSeat = "PER_SEAT".equalsIgnoreCase(space.getBookingMode());
        boolean isPerTable = "PER_TABLE".equalsIgnoreCase(space.getBookingMode());
        boolean isWholeSpace = !isPerSeat && !isPerTable;

        List<String> requestedSeats = request.getSelectedSeats();
        Long requestedTableId = request.getTableId();

        if (isWholeSpace && ((requestedSeats != null && !requestedSeats.isEmpty()) || requestedTableId != null)) {
            throw BusinessException.badRequest("SELECTION_NOT_ALLOWED", 
                    "Không gian loại [" + space.getSpaceTypeName() + "] chỉ áp dụng đặt trọn gói toàn bộ không gian, không hỗ trợ chọn vị trí ghế hoặc bàn riêng lẻ.");
        }

        SpaceTable targetTable = null;
        if (isPerTable) {
            if (requestedTableId == null) {
                throw BusinessException.badRequest("TABLE_REQUIRED", 
                        "Không gian loại [" + space.getSpaceTypeName() + "] yêu cầu chọn bàn cụ thể, vui lòng chọn mã bàn.");
            }
            if (spaceTableRepository != null) {
                targetTable = spaceTableRepository.findById(requestedTableId)
                        .orElseThrow(() -> BusinessException.notFound("TABLE_NOT_FOUND", 
                                "Không tìm thấy bàn với mã ID: " + requestedTableId));
                if (!targetTable.getSpace().getId().equals(space.getId())) {
                    throw BusinessException.badRequest("TABLE_SPACE_MISMATCH", 
                            "Bàn đã chọn không thuộc không gian " + space.getName());
                }
                if (targetTable.getDeletedAt() != null || (targetTable.getStatus() != null && !"AVAILABLE".equalsIgnoreCase(targetTable.getStatus().name()))) {
                    throw BusinessException.badRequest("TABLE_NOT_AVAILABLE", 
                            "Bàn [" + targetTable.getTableCode() + "] hiện đang tạm ngưng sử dụng hoặc đang bảo trì.");
                }
                if (request.getParticipantCount() > targetTable.getCapacity()) {
                    throw BusinessException.badRequest("CAPACITY_EXCEEDED", 
                            "Số người tham gia (" + request.getParticipantCount() + ") vượt quá sức chứa của bàn " + targetTable.getTableCode() + " (" + targetTable.getCapacity() + " chỗ)");
                }
            }
        }

        // BƯỚC 5: Kiểm tra booking đang chiếm chỗ của phòng
        List<Booking> overlappingSpaceBookings = bookingRepository.findOverlappingSpaceBookings(
                space.getId(), startTime, endTime, AvailabilityService.OCCUPYING_STATUSES
        );

        if (isPerTable) {
            // 5a. Kiểm tra nếu phòng bị đặt trọn gói trong khung giờ
            boolean wholeRoomOccupied = overlappingSpaceBookings.stream()
                    .anyMatch(b -> b.getTableId() == null && b.getSelectedSeatsList().isEmpty());
            if (wholeRoomOccupied) {
                Booking conflictBooking = overlappingSpaceBookings.stream()
                        .filter(b -> b.getTableId() == null && b.getSelectedSeatsList().isEmpty())
                        .findFirst().orElse(overlappingSpaceBookings.get(0));
                ConflictDetail conflict = ConflictDetail.builder()
                        .type("BOOKING")
                        .referenceId(conflictBooking.getId())
                        .startTime(conflictBooking.getStartTime())
                        .endTime(conflictBooking.getEndTime())
                        .description("Toàn bộ phòng đã có người đặt trước trong khung giờ này (Trạng thái: " + conflictBooking.getStatus().getDisplayName() + ")")
                        .build();
                throw BusinessException.conflict("BOOKING_TIME_CONFLICT", 
                        "Phòng đã có lịch đặt toàn bộ trong khoảng thời gian yêu cầu", 
                        Collections.singletonList(conflict));
            }

            // 5b. Kiểm tra xung đột chính bàn này
            Optional<Booking> tableConflictOpt = overlappingSpaceBookings.stream()
                    .filter(b -> b.getTableId() != null && b.getTableId().equals(requestedTableId))
                    .findFirst();
            if (tableConflictOpt.isPresent()) {
                Booking conflictBooking = tableConflictOpt.get();
                String tCode = targetTable != null ? targetTable.getTableCode() : ("#" + requestedTableId);
                ConflictDetail conflict = ConflictDetail.builder()
                        .type("TABLE_BOOKING")
                        .referenceId(conflictBooking.getId())
                        .startTime(conflictBooking.getStartTime())
                        .endTime(conflictBooking.getEndTime())
                        .description("Bàn [" + tCode + "] đã có người đặt trong khung giờ này (Trạng thái: " + conflictBooking.getStatus().getDisplayName() + ")")
                        .build();
                throw BusinessException.conflict("TABLE_ALREADY_OCCUPIED", 
                        "Bàn [" + tCode + "] vừa có người đặt trong khung giờ này. Vui lòng chọn bàn khác.",
                        Collections.singletonList(conflict));
            }
        } else if (requestedSeats != null && !requestedSeats.isEmpty()) {
            // 5a. Kiểm tra nếu phòng bị đặt trọn gói trong khung giờ
            boolean wholeRoomOccupied = overlappingSpaceBookings.stream()
                    .anyMatch(b -> b.getSelectedSeatsList().isEmpty());
            if (wholeRoomOccupied) {
                Booking conflictBooking = overlappingSpaceBookings.stream()
                        .filter(b -> b.getSelectedSeatsList().isEmpty())
                        .findFirst().orElse(overlappingSpaceBookings.get(0));
                ConflictDetail conflict = ConflictDetail.builder()
                        .type("BOOKING")
                        .referenceId(conflictBooking.getId())
                        .startTime(conflictBooking.getStartTime())
                        .endTime(conflictBooking.getEndTime())
                        .description("Toàn bộ phòng đã có người đặt trước trong khung giờ này (Trạng thái: " + conflictBooking.getStatus().getDisplayName() + ")")
                        .build();
                throw BusinessException.conflict("BOOKING_TIME_CONFLICT", 
                        "Phòng đã có lịch đặt toàn bộ trong khoảng thời gian yêu cầu", 
                        Collections.singletonList(conflict));
            }

            // 5b. Kiểm tra xung đột từng vị trí ghế (Seat concurrency lock)
            java.util.Set<String> occupiedSeats = overlappingSpaceBookings.stream()
                    .flatMap(b -> b.getSelectedSeatsList().stream())
                    .collect(Collectors.toSet());

            List<String> conflictingSeats = requestedSeats.stream()
                    .filter(occupiedSeats::contains)
                    .collect(Collectors.toList());

            if (!conflictingSeats.isEmpty()) {
                String itemsStr = String.join(", ", conflictingSeats);
                throw BusinessException.conflict("SEAT_ALREADY_OCCUPIED", 
                        "Vị trí ghế [" + itemsStr + "] vừa có người đặt trong khung giờ này. Vui lòng chọn vị trí khác.");
            }
        } else {
            // Đặt trọn phòng: nếu có bất kỳ booking nào (trọn phòng, theo ghế, hoặc theo bàn) thì không thể đặt trọn phòng
            if (!overlappingSpaceBookings.isEmpty()) {
                Booking conflictBooking = overlappingSpaceBookings.get(0);
                ConflictDetail conflict = ConflictDetail.builder()
                        .type("BOOKING")
                        .referenceId(conflictBooking.getId())
                        .startTime(conflictBooking.getStartTime())
                        .endTime(conflictBooking.getEndTime())
                        .description("Phòng đã có người đặt trong khung giờ này (Trạng thái: " + conflictBooking.getStatus().getDisplayName() + ")")
                        .build();
                throw BusinessException.conflict("BOOKING_TIME_CONFLICT", 
                        "Phòng đã có booking trong khoảng thời gian yêu cầu", 
                        Collections.singletonList(conflict));
            }
        }

        // BƯỚC 6: Kiểm tra booking đang chiếm chỗ khác của chính sinh viên
        List<Booking> overlappingStudentBookings = bookingRepository.findOverlappingStudentBookings(
                studentId, startTime, endTime, AvailabilityService.OCCUPYING_STATUSES
        );
        if (!overlappingStudentBookings.isEmpty()) {
            Booking conflictBooking = overlappingStudentBookings.get(0);
            ConflictDetail conflict = ConflictDetail.builder()
                    .type("USER_BOOKING")
                    .referenceId(conflictBooking.getId())
                    .startTime(conflictBooking.getStartTime())
                    .endTime(conflictBooking.getEndTime())
                    .description("Bạn đã có một lịch đặt khác vào khung giờ này")
                    .build();
            throw BusinessException.conflict("USER_BOOKING_CONFLICT", 
                    "Bạn đã có một booking khác trùng khoảng thời gian này", 
                    Collections.singletonList(conflict));
        }

        // BƯỚC 7: Kiểm tra xung đột lịch học chính khóa (Mock/Seed SIS)
        LocalDate bookingDate = startTime.toLocalDate();
        LocalTime startT = startTime.toLocalTime();
        LocalTime endT = endTime.toLocalTime();
        List<StudentSchedule> overlappingSchedules = studentScheduleRepository.findOverlappingSchedules(
                studentId, bookingDate, startT, endT
        );
        if (!overlappingSchedules.isEmpty()) {
            StudentSchedule sched = overlappingSchedules.get(0);
            ConflictDetail conflict = ConflictDetail.builder()
                    .type("STUDENT_SCHEDULE")
                    .referenceId(sched.getId())
                    .startTime(LocalDateTime.of(sched.getScheduleDate(), sched.getStartTime()))
                    .endTime(LocalDateTime.of(sched.getScheduleDate(), sched.getEndTime()))
                    .description("Trùng lịch học môn: " + sched.getCourseName() + " tại " + sched.getRoom())
                    .build();
            throw BusinessException.conflict("STUDENT_SCHEDULE_CONFLICT", 
                    "Trùng lịch học chính khóa: " + sched.getCourseName() + " (" + sched.getStartTime() + " - " + sched.getEndTime() + ")", 
                    Collections.singletonList(conflict));
        }

        // BƯỚC 8: Kiểm tra Quota ngày & Rate-limit tạo yêu cầu (kiểm tra độc lập)
        LocalDateTime dayStart = bookingDate.atStartOfDay();
        LocalDateTime dayEnd = bookingDate.plusDays(1).atStartOfDay();
        long dailyQuotaLimit = availabilityService.getPolicyLong("DAILY_BOOKING_QUOTA", 2L);
        long currentOccupyingCount = bookingRepository.countOccupyingBookingsForStudentOnDate(
                studentId, dayStart, dayEnd, AvailabilityService.OCCUPYING_STATUSES
        );
        if (currentOccupyingCount >= dailyQuotaLimit) {
            throw BusinessException.badRequest("QUOTA_EXCEEDED", 
                    "Bạn đã đạt hạn mức tối đa " + dailyQuotaLimit + " lượt đặt phòng trong ngày " + bookingDate);
        }

        long hourlyRateLimit = availabilityService.getPolicyLong("RATE_LIMIT_HOURLY", 10L);
        long recentRequests = bookingRepository.countRecentBookingsCreated(studentId, now.minusHours(1));
        if (recentRequests >= hourlyRateLimit) {
            throw BusinessException.badRequest("RATE_LIMIT_EXCEEDED", 
                    "Bạn đã gửi quá nhiều yêu cầu tạo đặt chỗ (" + recentRequests + " lần/giờ). Vui lòng thử lại sau.");
        }

        // BƯỚC 9: Xác định trạng thái ban đầu
        boolean requiresApproval = space.isRequiresApproval();
        BookingStatus initialStatus = requiresApproval ? BookingStatus.PENDING_APPROVAL : BookingStatus.CONFIRMED;

        // BƯỚC 10: Lưu booking và nhật ký thao tác
        int actualParticipantCount = (request.getSelectedSeats() != null && !request.getSelectedSeats().isEmpty())
                ? request.getSelectedSeats().size()
                : request.getParticipantCount();

        Booking booking = Booking.builder()
                .studentId(studentId)
                .spaceId(space.getId())
                .startTime(startTime)
                .endTime(endTime)
                .participantCount(actualParticipantCount)
                .purpose(request.getPurpose() != null ? request.getPurpose() : "Học tập & Thảo luận")
                .status(initialStatus)
                .tableId(requestedTableId)
                .build();

        if (request.getSelectedSeats() != null && !request.getSelectedSeats().isEmpty()) {
            booking.setSelectedSeatsList(request.getSelectedSeats());
        }

        booking = bookingRepository.save(booking);

        BookingAuditLog audit = BookingAuditLog.builder()
                .bookingId(booking.getId())
                .action(AuditAction.CREATE_BOOKING)
                .performedBy(studentId)
                .performedByEmail(userEmail)
                .performedAt(now)
                .reason("Khởi tạo yêu cầu đặt phòng")
                .note(requiresApproval ? "Phòng yêu cầu duyệt -> PENDING_APPROVAL" : "Phòng duyệt tự động -> CONFIRMED")
                .build();
        auditLogRepository.save(audit);

        log.info("Tạo booking #{} thành công cho sinh viên {} tại phòng {} với trạng thái {}", 
                booking.getId(), userEmail, space.getName(), initialStatus);

        return toBookingResponse(booking, now);
    }

    /**
     * Lấy danh sách booking của sinh viên đang đăng nhập.
     */
    @Transactional(readOnly = true)
    public List<BookingResponse> getMyBookings(String userEmail, BookingStatus status) {
        Long studentId = resolveStudentId(userEmail);
        LocalDateTime now = LocalDateTime.now();
        List<Booking> bookings = (status != null) 
                ? bookingRepository.findByStudentIdAndStatusOrderByStartTimeDesc(studentId, status)
                : bookingRepository.findByStudentIdOrderByStartTimeDesc(studentId);

        return bookings.stream()
                .map(b -> toBookingResponse(b, now))
                .collect(Collectors.toList());
    }

    /**
     * Xem chi tiết một booking.
     */
    @Transactional(readOnly = true)
    public BookingResponse getBookingById(Long id, String userEmail) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> BusinessException.notFound("BOOKING_NOT_FOUND", "Không tìm thấy booking với ID: " + id));
        requireOwnerOrStaff(booking, userEmail);

        return toBookingResponse(booking, LocalDateTime.now());
    }

    /**
     * Hủy booking trước giờ bắt đầu.
     */
    @Transactional
    public BookingResponse cancelBooking(Long id, String userEmail, String reason) {
        Booking booking = bookingRepository.findByIdForUpdate(id)
                .orElseThrow(() -> BusinessException.notFound("BOOKING_NOT_FOUND", "Không tìm thấy booking với ID: " + id));
        requireOwnerOrStaff(booking, userEmail);
        LocalDateTime now = LocalDateTime.now(checkInClock);

        if (booking.getStatus() != BookingStatus.PENDING_APPROVAL && booking.getStatus() != BookingStatus.CONFIRMED) {
            throw BusinessException.badRequest("CANNOT_CANCEL_STATUS", 
                    "Không thể hủy booking ở trạng thái: " + booking.getStatus().getDisplayName());
        }

        if (!now.isBefore(booking.getStartTime())) {
            throw BusinessException.badRequest("CANNOT_CANCEL_PAST_START", 
                    "Không thể hủy booking khi đã đến hoặc qua giờ bắt đầu");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);

        BookingAuditLog audit = BookingAuditLog.builder()
                .bookingId(booking.getId())
                .action(AuditAction.CANCEL_BOOKING)
                .performedBy(resolveStudentId(userEmail))
                .performedByEmail(userEmail)
                .performedAt(now)
                .reason(reason != null ? reason : "Người dùng chủ động hủy")
                .note("Giải phóng phòng cho sinh viên khác")
                .build();
        auditLogRepository.save(audit);

        log.info("Booking #{} đã bị hủy bởi {}", booking.getId(), userEmail);
        return toBookingResponse(booking, now);
    }

    /**
     * Duyệt booking (Staff).
     */
    @Transactional
    public BookingResponse approveBooking(Long id, String staffEmail) {
        Booking booking = bookingRepository.findByIdForUpdate(id)
                .orElseThrow(() -> BusinessException.notFound("BOOKING_NOT_FOUND", "Không tìm thấy booking với ID: " + id));
        LocalDateTime now = LocalDateTime.now(checkInClock);

        if (booking.getStatus() != BookingStatus.PENDING_APPROVAL) {
            throw BusinessException.badRequest("INVALID_STATUS_FOR_APPROVAL", 
                    "Chỉ có thể duyệt booking đang ở trạng thái Chờ duyệt. Trạng thái hiện tại: " + booking.getStatus().getDisplayName());
        }

        if (!now.isBefore(booking.getStartTime())) {
            throw BusinessException.conflict("BOOKING_APPROVAL_EXPIRED", "Đã quá thời hạn xử lý; scheduler sẽ chuyển booking sang EXPIRED.");
        }

        List<Booking> conflicts = bookingRepository.findOverlappingSpaceBookingsExcluding(
                booking.getSpaceId(), booking.getId(), booking.getStartTime(), booking.getEndTime(), AvailabilityService.OCCUPYING_STATUSES
        );
        if (!conflicts.isEmpty()) {
            throw BusinessException.conflict("BOOKING_TIME_CONFLICT", 
                    "Phòng đã phát sinh xung đột với lượt đặt khác trước thời điểm duyệt");
        }

        booking.setStatus(BookingStatus.CONFIRMED);
        bookingRepository.save(booking);

        BookingAuditLog audit = BookingAuditLog.builder()
                .bookingId(booking.getId())
                .action(AuditAction.APPROVE_BOOKING)
                .performedBy(resolveStudentId(staffEmail))
                .performedByEmail(staffEmail)
                .performedAt(now)
                .reason("Nhân viên vận hành phê duyệt")
                .note("Chuyển trạng thái từ PENDING_APPROVAL sang CONFIRMED")
                .build();
        auditLogRepository.save(audit);

        log.info("Booking #{} đã được duyệt thành công bởi Staff {}", booking.getId(), staffEmail);
        return toBookingResponse(booking, now);
    }

    /**
     * Từ chối booking (Staff).
     */
    @Transactional
    public BookingResponse rejectBooking(Long id, String staffEmail, String rejectReason) {
        if (rejectReason == null || rejectReason.trim().isEmpty()) {
            throw BusinessException.badRequest("REJECT_REASON_REQUIRED", "Lý do từ chối không được để trống theo quy tắc R-20");
        }

        Booking booking = bookingRepository.findByIdForUpdate(id)
                .orElseThrow(() -> BusinessException.notFound("BOOKING_NOT_FOUND", "Không tìm thấy booking với ID: " + id));
        LocalDateTime now = LocalDateTime.now(checkInClock);

        if (booking.getStatus() != BookingStatus.PENDING_APPROVAL) {
            throw BusinessException.badRequest("INVALID_STATUS_FOR_REJECTION", 
                    "Chỉ có thể từ chối booking đang Chờ duyệt. Trạng thái hiện tại: " + booking.getStatus().getDisplayName());
        }

        if (!now.isBefore(booking.getStartTime())) {
            throw BusinessException.conflict("BOOKING_APPROVAL_EXPIRED", "Đã quá thời hạn xử lý; scheduler sẽ chuyển booking sang EXPIRED.");
        }

        booking.setStatus(BookingStatus.REJECTED);
        booking.setRejectedBy(resolveStudentId(staffEmail));
        booking.setRejectedAt(now);
        booking.setRejectReason(rejectReason.trim());
        bookingRepository.save(booking);

        BookingAuditLog audit = BookingAuditLog.builder()
                .bookingId(booking.getId())
                .action(AuditAction.REJECT_BOOKING)
                .performedBy(resolveStudentId(staffEmail))
                .performedByEmail(staffEmail)
                .performedAt(now)
                .reason(rejectReason.trim())
                .note("Từ chối yêu cầu và giải phóng phòng")
                .build();
        auditLogRepository.save(audit);

        log.info("Booking #{} đã bị từ chối bởi Staff {}. Lý do: {}", booking.getId(), staffEmail, rejectReason);
        return toBookingResponse(booking, now);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getPendingBookingsForStaff() {
        LocalDateTime now = LocalDateTime.now();
        List<Booking> pendingBookings = bookingRepository.findActivePendingBookings(BookingStatus.PENDING_APPROVAL, now);
        return pendingBookings.stream()
                .map(b -> toBookingResponse(b, now))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BookingAuditLogResponse> getBookingAuditLogs(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> BusinessException.notFound("BOOKING_NOT_FOUND", "Không tìm thấy booking."));
        requireOwnerOrStaff(booking, SecurityUtils.getCurrentUserEmail());
        return auditLogRepository.findByBookingIdOrderByPerformedAtDesc(bookingId).stream()
                .map(log -> BookingAuditLogResponse.builder()
                        .id(log.getId())
                        .bookingId(log.getBookingId())
                        .action(log.getAction())
                        .actionDescription(log.getAction().getDescription())
                        .performedByName(log.getPerformedByEmail() != null ? log.getPerformedByEmail() : "Hệ thống")
                        .performedByEmail(log.getPerformedByEmail() != null ? log.getPerformedByEmail() : "system@eduspace.vn")
                        .performedAt(log.getPerformedAt())
                        .reason(log.getReason())
                        .note(log.getNote())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Lấy danh sách booking của một phòng trong khoảng thời gian cụ thể (hỗ trợ hiển thị Space Timeline).
     */
    public List<BookingResponse> getSpaceTimeline(Long spaceId, LocalDateTime fromTime, LocalDateTime toTime) {
        if (spaceId == null) {
            throw BusinessException.badRequest("SPACE_ID_REQUIRED", "Mã phòng không được để trống");
        }
        if (fromTime == null || toTime == null) {
            throw BusinessException.badRequest("TIME_RANGE_REQUIRED", "Khoảng thời gian tra cứu không được để trống");
        }
        if (!fromTime.isBefore(toTime)) {
            throw BusinessException.badRequest("INVALID_TIME_RANGE", "Thời điểm bắt đầu phải trước thời điểm kết thúc");
        }

        LocalDateTime now = LocalDateTime.now();
        List<Booking> bookings = bookingRepository.findTimelineBookings(
                spaceId, fromTime, toTime, AvailabilityService.OCCUPYING_STATUSES
        );

        return bookings.stream()
                .map(b -> toBookingResponse(b, now))
                .collect(Collectors.toList());
    }

    public BookingResponse toBookingResponse(Booking booking, LocalDateTime now) {
        boolean canCancel = (booking.getStatus() == BookingStatus.PENDING_APPROVAL || booking.getStatus() == BookingStatus.CONFIRMED)
                && now.isBefore(booking.getStartTime());

        long openMinutes = availabilityService.getPolicyLong("CHECKIN_OPEN_MINUTES", 15L);
        long graceMinutes = availabilityService.getPolicyLong("CHECKIN_GRACE_MINUTES", 15L);
        LocalDateTime openWindow = booking.getStartTime().minusMinutes(openMinutes);
        LocalDateTime closeWindow = booking.getStartTime().plusMinutes(graceMinutes);
        boolean canCheckIn = (booking.getStatus() == BookingStatus.CONFIRMED)
                && !now.isBefore(openWindow) && !now.isAfter(closeWindow);

        AvailabilityService.SpaceCatalogItem space = availabilityService.getSpaceCatalogItem(booking.getSpaceId());
        String spaceName = space != null ? space.getName() : "Phòng #" + booking.getSpaceId();
        String spaceTypeName = space != null ? space.getSpaceTypeName() : "Phòng học";
        boolean requiresApproval = space != null && space.isRequiresApproval();
        String building = space != null ? space.getBuilding() : "Khu vực chính";
        String floor = space != null ? space.getFloor() : "Tầng 1";

        String tableCode = null;
        if (booking.getTableId() != null && spaceTableRepository != null) {
            try {
                tableCode = spaceTableRepository.findById(booking.getTableId())
                        .map(SpaceTable::getTableCode)
                        .orElse(null);
            } catch (Exception ignored) {}
        }

        return BookingResponse.builder()
                .id(booking.getId())
                .studentId(booking.getStudentId())
                .studentName(userRepository.findById(booking.getStudentId()).map(User::getFullName).orElse(null))
                .studentEmail(resolveEmailFromStudentId(booking.getStudentId()))
                .spaceId(booking.getSpaceId())
                .spaceName(spaceName)
                .spaceTypeName(spaceTypeName)
                .requiresApproval(requiresApproval)
                .building(building)
                .floor(floor)
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .participantCount(booking.getParticipantCount())
                .purpose(booking.getPurpose())
                .status(booking.getStatus())
                .statusDisplayName(booking.getStatus().getDisplayName())
                .isOccupying(booking.getStatus().isOccupying())
                .rejectReason(booking.getRejectReason())
                .rejectedAt(booking.getRejectedAt())
                .expireReason(booking.getExpireReason())
                .expiredAt(booking.getExpiredAt())
                .checkedInAt(booking.getCheckedInAt())
                .checkedInBy(booking.getCheckedInBy())
                .createdAt(booking.getCreatedAt())
                .canCancel(canCancel)
                .canCheckIn(canCheckIn)
                .selectedSeats(booking.getSelectedSeatsList())
                .tableId(booking.getTableId())
                .tableCode(tableCode)
                .build();
    }

    private void requireOwnerOrStaff(Booking booking, String email) {
        Long actorId = resolveStudentId(email);
        if (!SecurityUtils.hasRole("STAFF") && !SecurityUtils.hasRole("ADMIN")
                && !actorId.equals(booking.getStudentId())) {
            throw BusinessException.forbidden("BOOKING_FORBIDDEN", "Bạn không có quyền truy cập booking này.");
        }
    }

    private Long resolveStudentId(String email) {
        if (email == null || email.isBlank() || "anonymousUser".equals(email)) {
            throw new BusinessException("UNAUTHENTICATED", "Bạn cần đăng nhập.", org.springframework.http.HttpStatus.UNAUTHORIZED);
        }
        return userRepository.findByEmail(email).filter(User::isActive)
                .map(User::getId)
                .orElseThrow(() -> new BusinessException("UNAUTHENTICATED", "Tài khoản không khả dụng.", org.springframework.http.HttpStatus.UNAUTHORIZED));
    }

    private String resolveEmailFromStudentId(Long id) {
        return userRepository.findById(id).map(User::getEmail).orElse(null);
    }
}
