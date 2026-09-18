package com.eduspace.backend.checkin;

import com.eduspace.backend.booking.entity.*;
import com.eduspace.backend.booking.repository.*;
import com.eduspace.backend.checkin.policy.repository.BookingPolicyRepository;
import com.eduspace.backend.booking.service.*;
import com.eduspace.backend.checkin.service.CheckInService;
import com.eduspace.backend.checkin.service.BookingTimeoutService;
import com.eduspace.backend.auth.entity.*;
import com.eduspace.backend.auth.repository.UserRepository;
import com.eduspace.backend.checkin.policy.service.PolicyService;
import com.eduspace.backend.checkin.policy.dto.request.PolicyUpdateRequest;
import com.eduspace.backend.auth.security.JwtTokenProvider;
import java.time.*;
import java.util.List;
import java.util.concurrent.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.setup.MockMvcBuilders.webAppContextSetup;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:checkin;MODE=MySQL;DB_CLOSE_DELAY=-1;LOCK_TIMEOUT=5000",
    "spring.datasource.driver-class-name=org.h2.Driver", "spring.datasource.username=sa",
    "spring.datasource.password=", "spring.jpa.hibernate.ddl-auto=create-drop",
    "booking.scheduler.enabled=false"
})
class BookingIntegrationTest {
    @Autowired BookingService service;
    @Autowired CheckInService checkInService;
    @Autowired BookingTimeoutService timeouts;
    @Autowired BookingRepository bookings;
    @Autowired BookingAuditLogRepository audits;
    @Autowired UserRepository users;
    @Autowired BookingPolicyRepository policyRows;
    @Autowired PolicyService policies;
    @Autowired JwtTokenProvider jwt;
    @Autowired WebApplicationContext context;
    @MockitoBean Clock checkInClock;
    MockMvc mvc;
    User owner;
    Booking booking;
    LocalDateTime start = LocalDateTime.of(2026, 9, 17, 10, 0);

    @BeforeEach void prepare() {
        audits.deleteAll(); bookings.deleteAll(); policyRows.deleteAll();
        owner = users.findByEmail("integration@example.com").orElseGet(() -> users.save(
                User.builder().email("integration@example.com").password("unused")
                .fullName("Test owner").role(Role.STUDENT).active(true).build()));
        owner.setActive(true); users.save(owner);
        booking = bookings.save(Booking.builder().studentId(owner.getId()).spaceId(1L)
                .participantCount(1).startTime(start).endTime(start.plusHours(1))
                .status(BookingStatus.CONFIRMED).build());
        when(checkInClock.getZone()).thenReturn(ZoneOffset.UTC);
        at(start);
        mvc = webAppContextSetup(context).apply(springSecurity()).build();
    }
    void at(LocalDateTime time) { when(checkInClock.instant()).thenReturn(time.toInstant(ZoneOffset.UTC)); }
    void login() {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                owner.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_STUDENT"))));
    }
    String token() {
        login(); String value = jwt.generateToken(SecurityContextHolder.getContext().getAuthentication());
        SecurityContextHolder.clearContext(); return value;
    }
    @AfterEach void clear() { SecurityContextHolder.clearContext(); }

    @Test void realJwtCheckInPersistsActorAndSingleAudit() throws Exception {
        mvc.perform(post("/api/bookings/" + booking.getId() + "/check-in").header("Authorization", "Bearer " + token()))
                .andExpect(status().isOk()).andExpect(jsonPath("checkedInBy").value(owner.getId()));
        assertEquals(BookingStatus.CHECKED_IN, bookings.findById(booking.getId()).orElseThrow().getStatus());
        assertEquals(1, audits.count());
    }
    @Test void missingAndMalformedTokensReturn401() throws Exception {
        mvc.perform(post("/api/bookings/" + booking.getId() + "/check-in")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/bookings/" + booking.getId() + "/check-in").header("Authorization", "Bearer invalid"))
                .andExpect(status().isUnauthorized());
    }
    @Test void lockedAccountTokenIsRejected() throws Exception {
        String value = token(); owner.setActive(false); users.save(owner);
        mvc.perform(post("/api/bookings/" + booking.getId() + "/check-in").header("Authorization", "Bearer " + value))
                .andExpect(status().isUnauthorized());
    }
    @Test void policyUpdateDrivesCheckInAndTimeoutBoundary() {
        policies.updatePolicy(new PolicyUpdateRequest(2, 90, 5, 10, 10, 5), "admin@example.com");
        assertEquals(90, policies.getCurrentPolicy().getMaxDurationMinutes());
        at(start.plusMinutes(5));
        assertFalse(timeouts.markNoShow(booking.getId()));
        login(); checkInService.checkIn(booking.getId());
        assertFalse(timeouts.markNoShow(booking.getId()));
        assertEquals(1, audits.count());
    }
    @Test void timeoutOnlyAfterBoundaryAndOnlyOnce() {
        at(start.plusMinutes(15)); assertFalse(timeouts.markNoShow(booking.getId()));
        at(start.plusMinutes(15).plusSeconds(1)); assertTrue(timeouts.markNoShow(booking.getId()));
        assertFalse(timeouts.markNoShow(booking.getId()));
        assertEquals(BookingStatus.NO_SHOW, bookings.findById(booking.getId()).orElseThrow().getStatus());
        assertEquals(1, audits.count());
    }
    @Test void rejectedPolicyDoesNotChangeStoredValues() {
        policies.updatePolicy(new PolicyUpdateRequest(2, 90, 5, 10, 10, 5), "admin@example.com");
        assertThrows(com.eduspace.backend.common.exception.BusinessException.class, () ->
                policies.updatePolicy(new PolicyUpdateRequest(2, 90, 5, 10, 10, 6), "admin@example.com"));
        assertEquals(5, policies.getCurrentPolicy().getCheckInGraceMinutes());
    }
    @Test void otherStudentCannotCheckInOrCancel() throws Exception {
        booking.setStudentId(owner.getId() + 100); bookings.save(booking);
        String value = token();
        mvc.perform(post("/api/bookings/" + booking.getId() + "/check-in").header("Authorization", "Bearer " + value))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/bookings/" + booking.getId() + "/cancel").header("Authorization", "Bearer " + value))
                .andExpect(status().isForbidden());
        assertEquals(0, audits.count());
    }
    @Test void checkInAndCancelCannotBothSucceed() throws Exception {
        at(start.minusMinutes(5));
        race(() -> { checkInService.checkIn(booking.getId()); },
                () -> { service.cancelBooking(booking.getId(), owner.getEmail(), "test"); });
        var status = bookings.findById(booking.getId()).orElseThrow().getStatus();
        assertTrue(status == BookingStatus.CHECKED_IN || status == BookingStatus.CANCELLED);
        assertEquals(1, audits.count());
    }
    @Test void overdueCheckInCannotOverwriteNoShow() throws Exception {
        at(start.plusMinutes(16));
        race(() -> { checkInService.checkIn(booking.getId()); }, () -> { timeouts.markNoShow(booking.getId()); });
        assertEquals(BookingStatus.NO_SHOW, bookings.findById(booking.getId()).orElseThrow().getStatus());
        assertEquals(1, audits.count());
    }
    void race(Runnable first, Runnable second) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(2);
        CountDownLatch go = new CountDownLatch(1);
        try {
            var futures = new java.util.ArrayList<Future<?>>();
            for (Runnable action : List.of(first, second)) {
                futures.add(pool.submit(() -> {
                    login();
                    try { go.await(5, TimeUnit.SECONDS); action.run(); }
                    catch (com.eduspace.backend.common.exception.BusinessException expected) {
                        assertTrue(List.of("INVALID_STATUS_FOR_CHECKIN", "CANNOT_CANCEL_STATUS", "CHECKIN_WINDOW_EXPIRED").contains(expected.getCode()));
                    } catch (InterruptedException ex) { Thread.currentThread().interrupt(); throw new RuntimeException(ex); }
                    finally { SecurityContextHolder.clearContext(); }
                }));
            }
            go.countDown();
            for (var future : futures) future.get(10, TimeUnit.SECONDS);
        } finally { pool.shutdownNow(); }
    }
    @Test void concurrentRequestsProduceOneCheckIn() throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(2);
        CountDownLatch ready = new CountDownLatch(2), go = new CountDownLatch(1);
        Callable<Boolean> request = () -> {
            login(); ready.countDown();
            try { go.await(5, TimeUnit.SECONDS); checkInService.checkIn(booking.getId()); return true; }
                    catch (com.eduspace.backend.common.exception.BusinessException ex) {
                assertEquals("INVALID_STATUS_FOR_CHECKIN", ex.getCode()); return false;
            } finally { SecurityContextHolder.clearContext(); }
        };
        try {
            Future<Boolean> first = pool.submit(request), second = pool.submit(request);
            assertTrue(ready.await(5, TimeUnit.SECONDS)); go.countDown();
            assertNotEquals(first.get(10, TimeUnit.SECONDS), second.get(10, TimeUnit.SECONDS));
            assertEquals(1, audits.count());
        } finally { go.countDown(); pool.shutdownNow(); }
    }
}
