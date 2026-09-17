package com.eduspace.backend.checkin;

import com.eduspace.backend.booking.entity.*;
import com.eduspace.backend.common.exception.BusinessException;
import com.eduspace.backend.booking.repository.*;
import com.eduspace.backend.booking.service.*;
import com.eduspace.backend.checkin.service.CheckInService;
import com.eduspace.backend.auth.entity.Role;
import com.eduspace.backend.auth.entity.User;
import com.eduspace.backend.auth.repository.UserRepository;
import com.eduspace.backend.space.repository.SpaceTableRepository;
import java.time.*;
import java.util.Optional;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class BookingCheckInTest {
    BookingRepository bookings;
    BookingAuditLogRepository audits;
    UserRepository users;
    AvailabilityService availability;
    CheckInService service;
    Booking booking;
    User actor;
    final LocalDateTime start = LocalDateTime.of(2026, 9, 17, 10, 0);

    @BeforeEach void setUp() {
        bookings = mock(BookingRepository.class);
        audits = mock(BookingAuditLogRepository.class);
        users = mock(UserRepository.class);
        availability = mock(AvailabilityService.class);
        actor = User.builder().id(42L).email("vu@example.com").role(Role.STUDENT).active(true).build();
        booking = new Booking();
        booking.setId(7L);
        booking.setStudentId(42L);
        booking.setSpaceId(1L);
        booking.setStartTime(start);
        booking.setStatus(BookingStatus.CONFIRMED);
        when(users.findByEmail(actor.getEmail())).thenReturn(Optional.of(actor));
        when(bookings.findByIdForUpdate(7L)).thenReturn(Optional.of(booking));
        when(availability.getPolicyLong("CHECKIN_OPEN_MINUTES", 15L)).thenReturn(15L);
        when(availability.getPolicyLong("CHECKIN_GRACE_MINUTES", 15L)).thenReturn(15L);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(actor.getEmail(), null, java.util.List.of()));
        at(start);
    }

    void at(LocalDateTime now) {
        var bookingService = new BookingService(bookings, audits, mock(StudentScheduleRepository.class),
                availability, mock(SpaceTableRepository.class), users, Clock.fixed(now.toInstant(ZoneOffset.UTC), ZoneOffset.UTC));
        service = new CheckInService(bookings, audits, availability, users,
                Clock.fixed(now.toInstant(ZoneOffset.UTC), ZoneOffset.UTC), bookingService);
    }

    @AfterEach void clearContext() { SecurityContextHolder.clearContext(); }

    @ParameterizedTest @ValueSource(ints = {-15, 0, 15})
    void acceptsInclusiveWindowAndRecordsActor(int offset) {
        at(start.plusMinutes(offset));
        var response = service.checkIn(7L);
        assertEquals(BookingStatus.CHECKED_IN, response.getStatus());
        assertEquals(42L, response.getCheckedInBy());
        assertEquals(start.plusMinutes(offset), response.getCheckedInAt());
        verify(audits).save(argThat(a -> a.getPerformedBy().equals(42L)
                && a.getAction() == AuditAction.CHECK_IN && a.getBookingId().equals(7L)
                && a.getPerformedAt().equals(response.getCheckedInAt())));
    }

    @ParameterizedTest @ValueSource(ints = {-901, 901})
    void rejectsOutsideWindowWithoutWrites(int seconds) {
        at(start.plusSeconds(seconds));
        assertCode(seconds < 0 ? "CHECKIN_TOO_EARLY" : "CHECKIN_WINDOW_EXPIRED");
        assertEquals(BookingStatus.CONFIRMED, booking.getStatus());
        verify(bookings, never()).save(any());
        verifyNoInteractions(audits);
    }

    @Test void rejectsOtherStudentsBooking() {
        booking.setStudentId(99L);
        var error = assertThrows(BusinessException.class, () -> service.checkIn(7L));
        assertEquals(403, error.getStatus().value());
        verifyNoInteractions(audits);
    }

    @ParameterizedTest @EnumSource(value = Role.class, names = {"STAFF", "ADMIN"})
    void staffAndAdminRecordTheirOwnIdentity(Role role) {
        actor.setRole(role);
        booking.setStudentId(99L);
        assertEquals(42L, service.checkIn(7L).getCheckedInBy());
    }

    @ParameterizedTest @EnumSource(value = BookingStatus.class, names = "CONFIRMED", mode = EnumSource.Mode.EXCLUDE)
    void rejectsOtherStates(BookingStatus status) {
        booking.setStatus(status);
        assertCode("INVALID_STATUS_FOR_CHECKIN");
        verifyNoInteractions(audits);
    }

    @Test void repeatedRequestDoesNotWriteAnotherAudit() {
        service.checkIn(7L);
        assertCode("INVALID_STATUS_FOR_CHECKIN");
        verify(audits, times(1)).save(any());
    }

    @Test void missingBookingReturns404() {
        when(bookings.findByIdForUpdate(7L)).thenReturn(Optional.empty());
        assertCode("BOOKING_NOT_FOUND");
    }

    @Test void anonymousCannotCheckIn() {
        SecurityContextHolder.clearContext();
        assertCode("UNAUTHENTICATED");
        verifyNoInteractions(bookings, audits);
    }

    @Test void inactiveAccountCannotCheckIn() {
        actor.setActive(false);
        assertCode("UNAUTHENTICATED");
        verifyNoInteractions(bookings, audits);
    }

    @Test void usesConfiguredGracePeriod() {
        when(availability.getPolicyLong("CHECKIN_GRACE_MINUTES", 15L)).thenReturn(5L);
        at(start.plusMinutes(6));
        assertCode("CHECKIN_WINDOW_EXPIRED");
    }

    private void assertCode(String expected) {
        assertEquals(expected, assertThrows(BusinessException.class, () -> service.checkIn(7L)).getCode());
    }
}
