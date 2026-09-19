package com.eduspace.backend.booking;

import com.eduspace.backend.auth.entity.Role;
import com.eduspace.backend.auth.entity.User;
import com.eduspace.backend.auth.repository.UserRepository;
import com.eduspace.backend.booking.dto.request.CreateBookingRequest;
import com.eduspace.backend.booking.dto.request.SearchSpaceFilter;
import com.eduspace.backend.booking.dto.response.AvailabilityResponse;
import com.eduspace.backend.booking.dto.response.BookingAuditLogResponse;
import com.eduspace.backend.booking.dto.response.BookingResponse;
import com.eduspace.backend.booking.dto.response.SpaceResponse;
import com.eduspace.backend.booking.entity.AuditAction;
import com.eduspace.backend.booking.entity.Booking;
import com.eduspace.backend.booking.entity.BookingAuditLog;
import com.eduspace.backend.booking.entity.BookingStatus;
import com.eduspace.backend.booking.entity.StudentSchedule;
import com.eduspace.backend.booking.repository.BookingAuditLogRepository;
import com.eduspace.backend.booking.repository.BookingRepository;
import com.eduspace.backend.booking.repository.StudentScheduleRepository;
import com.eduspace.backend.booking.service.AvailabilityService;
import com.eduspace.backend.booking.service.BookingService;
import com.eduspace.backend.common.exception.BusinessException;
import com.eduspace.backend.space.entity.Space;
import com.eduspace.backend.space.entity.SpaceTable;
import com.eduspace.backend.space.repository.SpaceRepository;
import com.eduspace.backend.space.repository.SpaceTableRepository;
import com.eduspace.backend.checkin.policy.service.PolicyService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * BỘ KIỂM THỬ TỰ ĐỘNG TOÀN DIỆN TOÀN BỘ PHÂN HỆ CỦA NGUYỄN THỊ KHÁNH VÂN:
 * - Module M03: Availability, Tra cứu phòng trống & Kiểm tra lịch khả dụng.
 * - Module M04: Booking Core, 10 bước kiểm tra xung đột, vòng đời đặt chỗ & phân quyền.
 */
class BookingCoreLogicTest {

    private BookingRepository bookingRepository;
    private BookingAuditLogRepository auditLogRepository;
    private StudentScheduleRepository studentScheduleRepository;
    private SpaceRepository spaceRepository;
    private SpaceTableRepository spaceTableRepository;
    private UserRepository userRepository;
    private PolicyService policyService;
    private com.eduspace.backend.staff.repository.MaintenanceBlockRepository maintenanceBlockRepository;

    private AvailabilityService availabilityService;
    private BookingService bookingService;

    private User student;
    private User otherStudent;
    private User staff;
    private LocalDateTime baseTime;

    @BeforeEach
    void setUp() {
        bookingRepository = mock(BookingRepository.class);
        auditLogRepository = mock(BookingAuditLogRepository.class);
        studentScheduleRepository = mock(StudentScheduleRepository.class);
        spaceRepository = mock(SpaceRepository.class);
        spaceTableRepository = mock(SpaceTableRepository.class);
        userRepository = mock(UserRepository.class);
        policyService = mock(PolicyService.class);
        maintenanceBlockRepository = mock(com.eduspace.backend.staff.repository.MaintenanceBlockRepository.class);

        baseTime = LocalDateTime.of(2026, 9, 20, 8, 0, 0);
        Clock fixedClock = Clock.fixed(baseTime.minusHours(1).toInstant(ZoneOffset.UTC), ZoneOffset.UTC);

        // Khởi tạo AvailabilityService
        availabilityService = new AvailabilityService(
                bookingRepository,
                auditLogRepository,
                spaceRepository,
                policyService,
                maintenanceBlockRepository
        );

        // Khởi tạo BookingService
        bookingService = new BookingService(
                bookingRepository,
                auditLogRepository,
                studentScheduleRepository,
                availabilityService,
                spaceTableRepository,
                userRepository,
                fixedClock,
                maintenanceBlockRepository
        );

        student = User.builder()
                .id(101L)
                .email("student@eduspace.vn")
                .fullName("Nguyễn Sinh Viên")
                .role(Role.STUDENT)
                .active(true)
                .build();

        otherStudent = User.builder()
                .id(102L)
                .email("other@eduspace.vn")
                .fullName("Lê Khách")
                .role(Role.STUDENT)
                .active(true)
                .build();

        staff = User.builder()
                .id(201L)
                .email("staff@eduspace.vn")
                .fullName("Trần Quản Trị")
                .role(Role.STAFF)
                .active(true)
                .build();

        when(userRepository.findByEmail(student.getEmail())).thenReturn(Optional.of(student));
        when(userRepository.findById(student.getId())).thenReturn(Optional.of(student));
        when(userRepository.findByEmail(otherStudent.getEmail())).thenReturn(Optional.of(otherStudent));
        when(userRepository.findById(otherStudent.getId())).thenReturn(Optional.of(otherStudent));
        when(userRepository.findByEmail(staff.getEmail())).thenReturn(Optional.of(staff));
        when(userRepository.findById(staff.getId())).thenReturn(Optional.of(staff));

        when(policyService.getLong(eq("DAILY_BOOKING_QUOTA"), anyLong())).thenReturn(5L);
        when(policyService.getLong(eq("RATE_LIMIT_HOURLY"), anyLong())).thenReturn(20L);
        when(policyService.getLong(eq("MAX_BOOKING_HOURS_PER_SLOT"), anyLong())).thenReturn(3L);
        when(policyService.getLong(eq("MAX_ADVANCE_DAYS"), anyLong())).thenReturn(7L);
        when(policyService.getLong(eq("CHECKIN_OPEN_MINUTES"), anyLong())).thenReturn(15L);
        when(policyService.getLong(eq("CHECKIN_GRACE_MINUTES"), anyLong())).thenReturn(15L);

        when(bookingRepository.save(any(Booking.class))).thenAnswer(inv -> {
            Booking b = inv.getArgument(0);
            if (b.getId() == null) b.setId(999L);
            return b;
        });

        // Đăng nhập mặc định bằng tài khoản sinh viên
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(student.getEmail(), null, List.of())
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    // =========================================================================
    // PHẦN 1: MODULE M03 - AVAILABILITY SERVICE (KIỂM TRA KHẢ DỤNG & TÌM KIẾM)
    // =========================================================================

    @Nested
    @DisplayName("Module M03 - Kiểm tra khả dụng phòng & Tra cứu")
    class AvailabilityTests {

        @Test
        @DisplayName("1.1. Kiểm tra phòng trống -> available = true, 0 conflict")
        void testCheckSpaceAvailability_Available() {
            Long spaceId = 1L;
            when(bookingRepository.findOverlappingSpaceBookings(eq(spaceId), any(), any(), any()))
                    .thenReturn(Collections.emptyList());

            AvailabilityResponse res = availabilityService.checkSpaceAvailability(
                    spaceId, baseTime, baseTime.plusHours(2)
            );

            assertNotNull(res);
            assertTrue(res.isAvailable());
            assertTrue(res.getConflicts().isEmpty());
        }

        @Test
        @DisplayName("1.2. Kiểm tra phòng đang bảo trì (MAINTENANCE) -> available = false")
        void testCheckSpaceAvailability_Maintenance() {
            Long maintenanceSpaceId = 6L; // Phòng G-103 trong catalog là MAINTENANCE
            AvailabilityResponse res = availabilityService.checkSpaceAvailability(
                    maintenanceSpaceId, baseTime, baseTime.plusHours(2)
            );

            assertNotNull(res);
            assertFalse(res.isAvailable());
            assertEquals("SPACE_STATUS", res.getConflicts().get(0).getType());
        }

        @Test
        @DisplayName("1.3. Kiểm tra phòng đã có người đặt -> available = false, báo conflict BOOKING")
        void testCheckSpaceAvailability_Occupied() {
            Long spaceId = 1L;
            Booking existing = Booking.builder()
                    .id(11L)
                    .spaceId(spaceId)
                    .startTime(baseTime)
                    .endTime(baseTime.plusHours(2))
                    .status(BookingStatus.CONFIRMED)
                    .build();

            when(bookingRepository.findOverlappingSpaceBookings(eq(spaceId), any(), any(), any()))
                    .thenReturn(List.of(existing));

            AvailabilityResponse res = availabilityService.checkSpaceAvailability(
                    spaceId, baseTime, baseTime.plusHours(2)
            );

            assertFalse(res.isAvailable());
            assertEquals(1, res.getConflicts().size());
            assertEquals("BOOKING", res.getConflicts().get(0).getType());
        }

        @Test
        @DisplayName("1.4. Lấy danh sách ghế đang bận (getOccupiedSeats) theo thời gian thực")
        void testGetOccupiedSeats() {
            Long spaceId = 4L; // Khu tự học PER_SEAT
            Booking b1 = Booking.builder().id(1L).spaceId(spaceId).selectedSeats("S01,S02").build();
            Booking b2 = Booking.builder().id(2L).spaceId(spaceId).selectedSeats("S05").build();

            when(bookingRepository.findOverlappingSpaceBookings(eq(spaceId), any(), any(), any()))
                    .thenReturn(List.of(b1, b2));

            List<String> occupied = availabilityService.getOccupiedSeats(spaceId, baseTime, baseTime.plusHours(2));
            assertEquals(List.of("S01", "S02", "S05"), occupied);
        }

        @Test
        @DisplayName("1.5. Chặn thời gian không hợp lệ: Quá khứ, ngoài giờ 7h-22h, vượt quá thời lượng")
        void testValidateBookingTimeLimits() {
            // Quá khứ
            assertThrows(BusinessException.class, () ->
                    availabilityService.validateBookingTimeLimits(baseTime.minusDays(1), baseTime)
            );

            // Ngoài giờ mở cửa (5h sáng)
            assertThrows(BusinessException.class, () ->
                    availabilityService.validateBookingTimeLimits(
                            baseTime.withHour(5), baseTime.withHour(7)
                    )
            );

            // Vượt quá thời lượng tối đa 3 tiếng (đặt 4 tiếng)
            assertThrows(BusinessException.class, () ->
                    availabilityService.validateBookingTimeLimits(
                            baseTime, baseTime.plusHours(4)
                    )
            );
        }
    }

    // =========================================================================
    // PHẦN 2: MODULE M04 - BOOKING CORE SERVICE (10 BƯỚC VALIDATE & 3 CHẾ ĐỘ)
    // =========================================================================

    @Nested
    @DisplayName("Module M04 - Tạo Đặt chỗ & Quy tắc 3 chế độ")
    class BookingCreationTests {

        @Test
        @DisplayName("2.1. [PER_SEAT] Không cần lý do -> Duyệt tức thì CONFIRMED, requiresApproval = false")
        void testCreateBooking_PerSeat_AutoConfirm() {
            Long spaceId = 4L;
            when(bookingRepository.findOverlappingSpaceBookings(eq(spaceId), any(), any(), any()))
                    .thenReturn(Collections.emptyList());

            CreateBookingRequest request = CreateBookingRequest.builder()
                    .spaceId(spaceId)
                    .startTime(baseTime)
                    .endTime(baseTime.plusHours(2))
                    .participantCount(1)
                    .purpose(null) // Không cần nhập lý do
                    .selectedSeats(List.of("S01"))
                    .build();

            BookingResponse response = bookingService.createBooking(request, student.getEmail());

            assertEquals(BookingStatus.CONFIRMED, response.getStatus());
            assertFalse(response.isRequiresApproval());
            assertEquals("Tự học cá nhân", response.getPurpose());
        }

        @Test
        @DisplayName("2.2. [PER_TABLE] Thiếu lý do sử dụng -> Báo lỗi PURPOSE_REQUIRED")
        void testCreateBooking_PerTable_MissingPurpose() {
            Long spaceId = 7L;
            CreateBookingRequest request = CreateBookingRequest.builder()
                    .spaceId(spaceId)
                    .startTime(baseTime)
                    .endTime(baseTime.plusHours(2))
                    .participantCount(4)
                    .purpose("   ") // Lý do rỗng
                    .tableId(1L)
                    .build();

            BusinessException ex = assertThrows(BusinessException.class, () ->
                    bookingService.createBooking(request, student.getEmail())
            );
            assertEquals("PURPOSE_REQUIRED", ex.getCode());
        }

        @Test
        @DisplayName("2.3. [PER_TABLE] Thiếu mã bàn -> Báo lỗi TABLE_REQUIRED")
        void testCreateBooking_PerTable_MissingTableId() {
            Long spaceId = 7L;
            CreateBookingRequest request = CreateBookingRequest.builder()
                    .spaceId(spaceId)
                    .startTime(baseTime)
                    .endTime(baseTime.plusHours(2))
                    .participantCount(4)
                    .purpose("Họp nhóm đồ án")
                    .tableId(null) // Thiếu tableId
                    .build();

            BusinessException ex = assertThrows(BusinessException.class, () ->
                    bookingService.createBooking(request, student.getEmail())
            );
            assertEquals("TABLE_REQUIRED", ex.getCode());
        }

        @Test
        @DisplayName("2.4. [PER_TABLE] Hợp lệ -> Chờ duyệt PENDING_APPROVAL, requiresApproval = true")
        void testCreateBooking_PerTable_Success() {
            Long spaceId = 7L;
            Space space = Space.builder().id(spaceId).name("Phòng D-201").build();
            SpaceTable table = SpaceTable.builder().id(2L).tableCode("T02").capacity(6).space(space).build();

            when(spaceTableRepository.findById(2L)).thenReturn(Optional.of(table));
            when(bookingRepository.findOverlappingSpaceBookings(eq(spaceId), any(), any(), any()))
                    .thenReturn(Collections.emptyList());

            CreateBookingRequest request = CreateBookingRequest.builder()
                    .spaceId(spaceId)
                    .startTime(baseTime)
                    .endTime(baseTime.plusHours(2))
                    .participantCount(4)
                    .purpose("Thảo luận nhóm đề án môn học")
                    .tableId(2L)
                    .build();

            BookingResponse response = bookingService.createBooking(request, student.getEmail());

            assertEquals(BookingStatus.PENDING_APPROVAL, response.getStatus());
            assertTrue(response.isRequiresApproval());
            assertEquals(2L, response.getTableId());
        }

        @Test
        @DisplayName("2.5. [WHOLE_SPACE] Thiếu lý do -> Báo lỗi PURPOSE_REQUIRED")
        void testCreateBooking_WholeSpace_MissingPurpose() {
            Long spaceId = 2L;
            CreateBookingRequest request = CreateBookingRequest.builder()
                    .spaceId(spaceId)
                    .startTime(baseTime)
                    .endTime(baseTime.plusHours(2))
                    .participantCount(6)
                    .purpose(null)
                    .build();

            BusinessException ex = assertThrows(BusinessException.class, () ->
                    bookingService.createBooking(request, student.getEmail())
            );
            assertEquals("PURPOSE_REQUIRED", ex.getCode());
        }

        @Test
        @DisplayName("2.6. [WHOLE_SPACE] Chọn vị trí ghế riêng lẻ -> Báo lỗi SELECTION_NOT_ALLOWED")
        void testCreateBooking_WholeSpace_SelectionNotAllowed() {
            Long spaceId = 2L;
            CreateBookingRequest request = CreateBookingRequest.builder()
                    .spaceId(spaceId)
                    .startTime(baseTime)
                    .endTime(baseTime.plusHours(2))
                    .participantCount(6)
                    .purpose("Hội thảo sinh viên")
                    .selectedSeats(List.of("A1")) // Không được chọn ghế ở phòng whole_space
                    .build();

            BusinessException ex = assertThrows(BusinessException.class, () ->
                    bookingService.createBooking(request, student.getEmail())
            );
            assertEquals("SELECTION_NOT_ALLOWED", ex.getCode());
        }

        @Test
        @DisplayName("2.7. Chặn vượt quá sức chứa tối đa của phòng -> CAPACITY_EXCEEDED")
        void testCreateBooking_CapacityExceeded() {
            Long spaceId = 1L; // Sức chứa 6 người
            CreateBookingRequest request = CreateBookingRequest.builder()
                    .spaceId(spaceId)
                    .startTime(baseTime)
                    .endTime(baseTime.plusHours(2))
                    .participantCount(15) // Vượt quá 6
                    .purpose("Họp lớp đông người")
                    .build();

            BusinessException ex = assertThrows(BusinessException.class, () ->
                    bookingService.createBooking(request, student.getEmail())
            );
            assertEquals("CAPACITY_EXCEEDED", ex.getCode());
        }

        @Test
        @DisplayName("2.8. Chặn trùng vị trí ghế đang có người ngồi -> SEAT_ALREADY_OCCUPIED")
        void testCreateBooking_SeatAlreadyOccupied() {
            Long spaceId = 4L;
            Booking existing = Booking.builder()
                    .id(15L)
                    .spaceId(spaceId)
                    .selectedSeats("S01,S02")
                    .status(BookingStatus.CONFIRMED)
                    .build();

            when(bookingRepository.findOverlappingSpaceBookings(eq(spaceId), any(), any(), any()))
                    .thenReturn(List.of(existing));

            CreateBookingRequest request = CreateBookingRequest.builder()
                    .spaceId(spaceId)
                    .startTime(baseTime)
                    .endTime(baseTime.plusHours(2))
                    .participantCount(1)
                    .selectedSeats(List.of("S02")) // Trùng ghế S02
                    .build();

            BusinessException ex = assertThrows(BusinessException.class, () ->
                    bookingService.createBooking(request, student.getEmail())
            );
            assertEquals("SEAT_ALREADY_OCCUPIED", ex.getCode());
        }

        @Test
        @DisplayName("2.9. Chặn sinh viên tự đặt trùng lịch chính mình -> USER_BOOKING_CONFLICT")
        void testCreateBooking_UserBookingConflict() {
            Long spaceId = 1L;
            Booking myOtherBooking = Booking.builder()
                    .id(22L)
                    .studentId(student.getId())
                    .startTime(baseTime)
                    .endTime(baseTime.plusHours(2))
                    .status(BookingStatus.CONFIRMED)
                    .build();

            when(bookingRepository.findOverlappingStudentBookings(eq(student.getId()), any(), any(), any()))
                    .thenReturn(List.of(myOtherBooking));

            CreateBookingRequest request = CreateBookingRequest.builder()
                    .spaceId(spaceId)
                    .startTime(baseTime)
                    .endTime(baseTime.plusHours(2))
                    .participantCount(4)
                    .purpose("Đặt thêm phòng khác cùng giờ")
                    .build();

            BusinessException ex = assertThrows(BusinessException.class, () ->
                    bookingService.createBooking(request, student.getEmail())
            );
            assertEquals("USER_BOOKING_CONFLICT", ex.getCode());
        }

        @Test
        @DisplayName("2.10. Chặn sinh viên trùng thời khóa biểu chính khóa -> STUDENT_SCHEDULE_CONFLICT")
        void testCreateBooking_StudentScheduleConflict() {
            Long spaceId = 1L;
            StudentSchedule schedule = StudentSchedule.builder()
                    .id(5L)
                    .studentId(student.getId())
                    .courseName("Lập trình Java Nâng cao")
                    .scheduleDate(baseTime.toLocalDate())
                    .startTime(baseTime.toLocalTime())
                    .endTime(baseTime.plusHours(2).toLocalTime())
                    .room("A101")
                    .build();

            when(studentScheduleRepository.findOverlappingSchedules(eq(student.getId()), any(), any(), any()))
                    .thenReturn(List.of(schedule));

            CreateBookingRequest request = CreateBookingRequest.builder()
                    .spaceId(spaceId)
                    .startTime(baseTime)
                    .endTime(baseTime.plusHours(2))
                    .participantCount(4)
                    .purpose("Đặt phòng trong giờ học trên lớp")
                    .build();

            BusinessException ex = assertThrows(BusinessException.class, () ->
                    bookingService.createBooking(request, student.getEmail())
            );
            assertEquals("STUDENT_SCHEDULE_CONFLICT", ex.getCode());
        }

        @Test
        @DisplayName("2.11. Chặn vượt quá hạn mức đặt phòng theo ngày -> QUOTA_EXCEEDED")
        void testCreateBooking_QuotaExceeded() {
            Long spaceId = 1L;
            when(bookingRepository.countOccupyingBookingsForStudentOnDate(eq(student.getId()), any(), any(), any()))
                    .thenReturn(5L); // Đã chạm hạn mức 5 lần/ngày

            CreateBookingRequest request = CreateBookingRequest.builder()
                    .spaceId(spaceId)
                    .startTime(baseTime)
                    .endTime(baseTime.plusHours(2))
                    .participantCount(4)
                    .purpose("Đặt thêm phòng thứ 6 trong ngày")
                    .build();

            BusinessException ex = assertThrows(BusinessException.class, () ->
                    bookingService.createBooking(request, student.getEmail())
            );
            assertEquals("QUOTA_EXCEEDED", ex.getCode());
        }
    }

    // =========================================================================
    // PHẦN 3: VÒNG ĐỜI BOOKING & PHÂN QUYỀN (HỦY, DUYỆT, TỪ CHỐI, BẢO MẬT)
    // =========================================================================

    @Nested
    @DisplayName("Module M04 - Vòng đời & Quản lý Đặt chỗ")
    class LifecycleAndSecurityTests {

        @Test
        @DisplayName("3.1. Sinh viên chủ động hủy trước giờ bắt đầu -> CANCELLED thành công")
        void testCancelBooking_Success() {
            Long bookingId = 30L;
            Booking booking = Booking.builder()
                    .id(bookingId)
                    .studentId(student.getId())
                    .status(BookingStatus.CONFIRMED)
                    .startTime(baseTime.plusHours(2))
                    .endTime(baseTime.plusHours(4))
                    .build();

            when(bookingRepository.findByIdForUpdate(bookingId)).thenReturn(Optional.of(booking));

            BookingResponse res = bookingService.cancelBooking(bookingId, student.getEmail(), "Bận việc đột xuất");

            assertEquals(BookingStatus.CANCELLED, res.getStatus());
            verify(bookingRepository).save(booking);
        }

        @Test
        @DisplayName("3.2. Chặn sinh viên hủy khi đã đến hoặc qua giờ bắt đầu -> CANNOT_CANCEL_PAST_START")
        void testCancelBooking_PastStartTime() {
            Long bookingId = 31L;
            Booking booking = Booking.builder()
                    .id(bookingId)
                    .studentId(student.getId())
                    .status(BookingStatus.CONFIRMED)
                    .startTime(baseTime.minusHours(2)) // Đã qua giờ bắt đầu so với clock
                    .endTime(baseTime.plusHours(1))
                    .build();

            when(bookingRepository.findByIdForUpdate(bookingId)).thenReturn(Optional.of(booking));

            BusinessException ex = assertThrows(BusinessException.class, () ->
                    bookingService.cancelBooking(bookingId, student.getEmail(), "Muốn hủy muộn")
            );
            assertEquals("CANNOT_CANCEL_PAST_START", ex.getCode());
        }

        @Test
        @DisplayName("3.3. Staff duyệt yêu cầu PENDING_APPROVAL -> Chuyển thành CONFIRMED")
        void testApproveBooking_Success() {
            Long bookingId = 40L;
            Booking pending = Booking.builder()
                    .id(bookingId)
                    .studentId(student.getId())
                    .spaceId(2L)
                    .status(BookingStatus.PENDING_APPROVAL)
                    .startTime(baseTime.plusHours(1))
                    .endTime(baseTime.plusHours(3))
                    .build();

            when(bookingRepository.findByIdForUpdate(bookingId)).thenReturn(Optional.of(pending));

            BookingResponse res = bookingService.approveBooking(bookingId, staff.getEmail());

            assertEquals(BookingStatus.CONFIRMED, res.getStatus());
        }

        @Test
        @DisplayName("3.4. Staff từ chối yêu cầu không nhập lý do -> REJECT_REASON_REQUIRED")
        void testRejectBooking_MissingReason() {
            Long bookingId = 41L;
            BusinessException ex = assertThrows(BusinessException.class, () ->
                    bookingService.rejectBooking(bookingId, staff.getEmail(), "   ")
            );
            assertEquals("REJECT_REASON_REQUIRED", ex.getCode());
        }

        @Test
        @DisplayName("3.5. Staff từ chối có lý do -> Chuyển thành REJECTED và lưu lý do")
        void testRejectBooking_Success() {
            Long bookingId = 42L;
            Booking pending = Booking.builder()
                    .id(bookingId)
                    .studentId(student.getId())
                    .status(BookingStatus.PENDING_APPROVAL)
                    .startTime(baseTime.plusHours(1))
                    .endTime(baseTime.plusHours(3))
                    .build();

            when(bookingRepository.findByIdForUpdate(bookingId)).thenReturn(Optional.of(pending));

            BookingResponse res = bookingService.rejectBooking(bookingId, staff.getEmail(), "Phòng cần sửa chữa đột xuất");

            assertEquals(BookingStatus.REJECTED, res.getStatus());
            assertEquals("Phòng cần sửa chữa đột xuất", res.getRejectReason());
        }

        @Test
        @DisplayName("3.6. Bảo mật: Chặn sinh viên khác xem trộm chi tiết booking của người khác -> 403 Forbidden")
        void testGetBookingById_ForbiddenForOtherUser() {
            Long bookingId = 43L;
            Booking bookingOfStudent = Booking.builder()
                    .id(bookingId)
                    .studentId(student.getId())
                    .status(BookingStatus.CONFIRMED)
                    .build();

            when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(bookingOfStudent));

            BusinessException ex = assertThrows(BusinessException.class, () ->
                    bookingService.getBookingById(bookingId, otherStudent.getEmail())
            );
            assertEquals("BOOKING_FORBIDDEN", ex.getCode());
        }
    }

    // =========================================================================
    // PHẦN 4: SCHEDULER TỰ ĐỘNG CHUYỂN TRẠNG THÁI PHỤ THUỘC THỜI GIAN
    // =========================================================================

    @Nested
    @DisplayName("Module M04 - Tự động hóa Scheduler Chuyển trạng thái")
    class SchedulerAutomationTests {

        @Test
        @DisplayName("4.1. Tự động chuyển PENDING_APPROVAL quá hạn sang EXPIRED")
        void testExpirePendingApproval() {
            Booking overduePending = Booking.builder()
                    .id(88L)
                    .status(BookingStatus.PENDING_APPROVAL)
                    .startTime(baseTime.minusMinutes(1))
                    .endTime(baseTime.plusHours(1))
                    .build();

            when(bookingRepository.findPendingOverdueBookings(eq(BookingStatus.PENDING_APPROVAL), any()))
                    .thenReturn(List.of(overduePending));

            availabilityService.expirePendingApproval(baseTime);

            assertEquals(BookingStatus.EXPIRED, overduePending.getStatus());
            assertEquals("PENDING_APPROVAL_TIMEOUT", overduePending.getExpireReason());
            verify(bookingRepository).save(overduePending);
            verify(auditLogRepository).save(any());
        }

        @Test
        @DisplayName("4.2. Tự động chuyển CHECKED_IN qua endTime sang COMPLETED")
        void testCompleteOverdueCheckedIn() {
            Booking overdueCheckedIn = Booking.builder()
                    .id(89L)
                    .status(BookingStatus.CHECKED_IN)
                    .startTime(baseTime.minusHours(3))
                    .endTime(baseTime.minusMinutes(5)) // Đã qua endTime 5 phút
                    .build();

            when(bookingRepository.findCompletedCandidateBookings(eq(BookingStatus.CHECKED_IN), any()))
                    .thenReturn(List.of(overdueCheckedIn));

            availabilityService.completeOverdueCheckedIn(baseTime);

            assertEquals(BookingStatus.COMPLETED, overdueCheckedIn.getStatus());
            verify(bookingRepository).save(overdueCheckedIn);
            verify(auditLogRepository).save(any());
        }
    }
}
