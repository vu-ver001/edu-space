package com.eduspace.backend.staff.service;

import com.eduspace.backend.auth.entity.User;
import com.eduspace.backend.auth.repository.UserRepository;
import com.eduspace.backend.auth.security.SecurityUtils;
import com.eduspace.backend.booking.dto.response.BookingResponse;
import com.eduspace.backend.booking.service.BookingService;
import com.eduspace.backend.checkin.service.CheckInService;
import com.eduspace.backend.common.exception.AppException;
import com.eduspace.backend.space.entity.Space;
import com.eduspace.backend.space.entity.MaintenanceBlock;
import com.eduspace.backend.space.repository.SpaceRepository;
import com.eduspace.backend.staff.dto.request.BookingRejectRequestKT;
import com.eduspace.backend.staff.dto.response.PendingBookingResponseKT;
import com.eduspace.backend.staff.dto.response.StaffTimelineEventResponseKT;
import com.eduspace.backend.staff.dto.response.StaffTimelineResponseKT;
import com.eduspace.backend.staff.entity.StaffAuditAction;
import com.eduspace.backend.staff.repository.MaintenanceBlockRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class StaffOperationsService {

    private final BookingService bookingService;
    private final CheckInService checkInService;
    private final MaintenanceBlockRepository maintenanceBlockRepository;
    private final SpaceRepository spaceRepository;
    private final StaffAuditService staffAuditService;
    private final UserRepository userRepository;

    /**
     * Chức năng 1: Xem Space Timeline theo khoảng thời gian.
     * Gộp danh sách Booking và Maintenance events, sắp xếp theo thời gian tăng dần.
     */
    @Transactional(readOnly = true)
    public StaffTimelineResponseKT getSpaceTimeline(Long spaceId, LocalDateTime from, LocalDateTime to) {
        Space space = spaceRepository.findByIdAndDeletedAtIsNull(spaceId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "SPACE_NOT_FOUND",
                        "Không tìm thấy không gian với ID: " + spaceId));

        if (from == null || to == null) {
            throw new AppException(HttpStatus.BAD_REQUEST, "INVALID_TIMELINE_RANGE",
                    "Khoảng thời gian bắt đầu và kết thúc tra cứu không được để trống");
        }
        if (!from.isBefore(to)) {
            throw new AppException(HttpStatus.BAD_REQUEST, "INVALID_TIMELINE_RANGE",
                    "Thời điểm bắt đầu phải trước thời điểm kết thúc");
        }

        List<StaffTimelineEventResponseKT> events = new ArrayList<>();

        // 1. Lấy Booking events từ Booking Core
        List<BookingResponse> bookings = bookingService.getSpaceTimeline(spaceId, from, to);
        for (BookingResponse b : bookings) {
            events.add(StaffTimelineEventResponseKT.builder()
                    .eventType("BOOKING")
                    .eventId(b.getId())
                    .spaceId(space.getId())
                    .spaceName(space.getName())
                    .startTime(b.getStartTime())
                    .endTime(b.getEndTime())
                    .status(b.getStatus() != null ? b.getStatus().name() : "CONFIRMED")
                    .title("Đặt chỗ #" + b.getId() + ": " + (b.getPurpose() != null ? b.getPurpose() : "Sử dụng không gian"))
                    .bookingMode(space.getSpaceType() != null ? space.getSpaceType().getBookingMode().name() : "WHOLE_SPACE")
                    .tableId(b.getTableId())
                    .tableCode(b.getTableCode())
                    .selectedSeats(b.getSelectedSeats())
                    .participantCount(b.getParticipantCount())
                    .purpose(b.getPurpose())
                    .studentId(b.getStudentId())
                    .studentName(b.getStudentName())
                    .studentEmail(b.getStudentEmail())
                    .createdAt(b.getCreatedAt())
                    .build());
        }

        // 2. Lấy Maintenance events từ Maintenance module
        List<MaintenanceBlock> maintenanceBlocks = maintenanceBlockRepository.findActiveBlocksInPeriod(spaceId, from, to);
        for (MaintenanceBlock m : maintenanceBlocks) {
            String creatorEmail = "staff@eduspace.vn";
            if (m.getCreatedBy() != null && m.getCreatedBy() > 0) {
                creatorEmail = userRepository.findById(m.getCreatedBy())
                        .map(User::getEmail)
                        .orElse("staff@eduspace.vn");
            }

            events.add(StaffTimelineEventResponseKT.builder()
                    .eventType("MAINTENANCE")
                    .eventId(m.getId())
                    .spaceId(space.getId())
                    .spaceName(space.getName())
                    .startTime(m.getStartTime())
                    .endTime(m.getEndTime())
                    .status("MAINTENANCE")
                    .title("Bảo trì #" + m.getId() + ": " + m.getReason())
                    .bookingMode(space.getSpaceType() != null ? space.getSpaceType().getBookingMode().name() : "WHOLE_SPACE")
                    .reason(m.getReason())
                    .createdBy(m.getCreatedBy())
                    .creatorEmail(creatorEmail)
                    .createdAt(m.getCreatedAt())
                    .build());
        }

        // 3. Sắp xếp toàn bộ sự kiện theo thời gian bắt đầu tăng dần
        events.sort(Comparator.comparing(StaffTimelineEventResponseKT::getStartTime));

        String bMode = space.getSpaceType() != null ? space.getSpaceType().getBookingMode().name() : "WHOLE_SPACE";

        return StaffTimelineResponseKT.builder()
                .spaceId(space.getId())
                .spaceName(space.getName())
                .bookingMode(bMode)
                .from(from)
                .to(to)
                .totalEvents(events.size())
                .events(events)
                .build();
    }

    /**
     * Chức năng 2: Xem danh sách Booking đang chờ duyệt (PENDING_APPROVAL).
     * Tự động loại trừ các booking đã quá hạn startTime.
     */
    @Transactional(readOnly = true)
    public List<PendingBookingResponseKT> getPendingBookings(Long spaceId) {
        List<BookingResponse> list = bookingService.getPendingBookingsForStaff();

        if (spaceId != null) {
            list = list.stream()
                    .filter(b -> spaceId.equals(b.getSpaceId()))
                    .collect(Collectors.toList());
        }

        return list.stream()
                .map(this::toPendingResponse)
                .collect(Collectors.toList());
    }

    /**
     * Chức năng 3: Duyệt Booking (PENDING_APPROVAL -> CONFIRMED).
     * Delegate toàn bộ rule sang Booking Core và ghi Staff Audit Log.
     */
    @Transactional
    public BookingResponse approveBooking(Long bookingId) {
        User staff = resolveCurrentUser();
        String staffEmail = staff != null ? staff.getEmail() : "staff@eduspace.vn";
        Long staffId = staff != null ? staff.getId() : 2L;

        BookingResponse response = bookingService.approveBooking(bookingId, staffEmail);

        // Ghi Staff Audit Log khi duyệt thành công
        staffAuditService.logAction(staffId, staffEmail, StaffAuditAction.BOOKING_APPROVED,
                "BOOKING", bookingId, response.getSpaceId(), "Staff phê duyệt đặt chỗ #" + bookingId);

        log.info("Staff {} đã duyệt thành công booking #{}", staffEmail, bookingId);
        return response;
    }

    /**
     * Chức năng 4: Từ chối Booking (PENDING_APPROVAL -> REJECTED).
     * Bắt buộc nhập lý do từ chối. Delegate toàn bộ rule sang Booking Core và ghi Staff Audit Log.
     */
    @Transactional
    public BookingResponse rejectBooking(Long bookingId, BookingRejectRequestKT request) {
        if (request == null || request.getReason() == null || request.getReason().trim().isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "REJECT_REASON_REQUIRED",
                    "Lý do từ chối không được để trống theo quy tắc R-20");
        }

        User staff = resolveCurrentUser();
        String staffEmail = staff != null ? staff.getEmail() : "staff@eduspace.vn";
        Long staffId = staff != null ? staff.getId() : 2L;

        BookingResponse response = bookingService.rejectBooking(bookingId, staffEmail, request.getReason().trim());

        // Ghi Staff Audit Log khi từ chối thành công
        staffAuditService.logAction(staffId, staffEmail, StaffAuditAction.BOOKING_REJECTED,
                "BOOKING", bookingId, response.getSpaceId(), "Lý do: " + request.getReason().trim());

        log.info("Staff {} đã từ chối booking #{}. Lý do: {}", staffEmail, bookingId, request.getReason().trim());
        return response;
    }

    /**
     * Chức năng 6: Staff hỗ trợ Check-in cho sinh viên tại quầy.
     * Tái sử dụng CheckInService dùng chung, ghi Staff Audit Log.
     */
    @Transactional
    public BookingResponse staffAssistedCheckIn(Long bookingId) {
        User staff = resolveCurrentUser();
        String staffEmail = staff != null ? staff.getEmail() : "staff@eduspace.vn";
        Long staffId = staff != null ? staff.getId() : 2L;

        BookingResponse response = checkInService.checkIn(bookingId);

        // Ghi Staff Audit Log
        staffAuditService.logAction(staffId, staffEmail, StaffAuditAction.STAFF_CHECKED_IN_BOOKING,
                "BOOKING", bookingId, response.getSpaceId(), "Nhân viên hỗ trợ check-in tại quầy cho sinh viên");

        log.info("Staff {} đã hỗ trợ check-in thành công cho booking #{}", staffEmail, bookingId);
        return response;
    }

    private User resolveCurrentUser() {
        String email = SecurityUtils.getCurrentUserEmail();
        if (email == null || "anonymousUser".equalsIgnoreCase(email)) {
            return null;
        }
        return userRepository.findByEmail(email).orElse(null);
    }

    private PendingBookingResponseKT toPendingResponse(BookingResponse b) {
        return PendingBookingResponseKT.builder()
                .bookingId(b.getId())
                .spaceId(b.getSpaceId())
                .spaceName(b.getSpaceName())
                .spaceTypeName(b.getSpaceTypeName())
                .bookingMode(b.getTableId() != null ? "PER_TABLE" : (b.getSelectedSeats() != null && !b.getSelectedSeats().isEmpty() ? "PER_SEAT" : "WHOLE_SPACE"))
                .tableId(b.getTableId())
                .tableCode(b.getTableCode())
                .selectedSeats(b.getSelectedSeats())
                .studentId(b.getStudentId())
                .studentName(b.getStudentName())
                .studentEmail(b.getStudentEmail())
                .startTime(b.getStartTime())
                .endTime(b.getEndTime())
                .participantCount(b.getParticipantCount())
                .purpose(b.getPurpose())
                .status(b.getStatus() != null ? b.getStatus().name() : "PENDING_APPROVAL")
                .statusDisplayName(b.getStatusDisplayName())
                .requiresApproval(b.isRequiresApproval())
                .createdAt(b.getCreatedAt())
                .build();
    }
}
