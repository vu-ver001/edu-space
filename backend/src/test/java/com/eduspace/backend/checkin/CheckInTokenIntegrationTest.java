package com.eduspace.backend.checkin;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.eduspace.backend.auth.entity.Role;
import com.eduspace.backend.auth.entity.User;
import com.eduspace.backend.auth.repository.UserRepository;
import com.eduspace.backend.auth.security.JwtTokenProvider;
import com.eduspace.backend.booking.entity.Booking;
import com.eduspace.backend.booking.entity.BookingStatus;
import com.eduspace.backend.booking.repository.BookingAuditLogRepository;
import com.eduspace.backend.booking.repository.BookingRepository;
import com.eduspace.backend.checkin.entity.CheckInToken;
import com.eduspace.backend.checkin.entity.CheckInTokenStatus;
import com.eduspace.backend.checkin.repository.CheckInTokenRepository;
import com.eduspace.backend.policy.repository.BookingPolicyRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.setup.MockMvcBuilders.webAppContextSetup;
import static org.mockito.Mockito.when;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:checkin;MODE=MySQL;DB_CLOSE_DELAY=-1;LOCK_TIMEOUT=5000",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "booking.scheduler.enabled=false"
})
class CheckInTokenIntegrationTest {

    @Autowired BookingRepository bookings;
    @Autowired BookingAuditLogRepository audits;
    @Autowired CheckInTokenRepository tokens;
    @Autowired BookingPolicyRepository policies;
    @Autowired UserRepository users;
    @Autowired JwtTokenProvider jwt;
    ObjectMapper objectMapper = new ObjectMapper();
    @Autowired WebApplicationContext context;
    @MockitoBean Clock checkInClock;

    MockMvc mvc;
    User owner;
    User staff;
    Booking booking;
    final LocalDateTime start = LocalDateTime.of(2026, 9, 17, 10, 0);

    @BeforeEach
    void prepare() {
        tokens.deleteAll();
        audits.deleteAll();
        bookings.deleteAll();
        policies.deleteAll();
        owner = users.findByEmail("token-owner@example.com").orElseGet(() -> users.save(User.builder()
                .email("token-owner@example.com")
                .password("unused")
                .fullName("Token owner")
                .role(Role.STUDENT)
                .active(true)
                .build()));
        owner.setActive(true);
        owner.setRole(Role.STUDENT);
        users.save(owner);
        staff = users.findByEmail("token-staff@example.com").orElseGet(() -> users.save(User.builder()
                .email("token-staff@example.com")
                .password("unused")
                .fullName("Token staff")
                .role(Role.STAFF)
                .active(true)
                .build()));
        staff.setActive(true);
        staff.setRole(Role.STAFF);
        users.save(staff);
        booking = bookings.save(Booking.builder()
                .studentId(owner.getId())
                .spaceId(1L)
                .participantCount(1)
                .startTime(start)
                .endTime(start.plusHours(1))
                .status(BookingStatus.CONFIRMED)
                .build());
        when(checkInClock.getZone()).thenReturn(ZoneOffset.UTC);
        at(start);
        mvc = webAppContextSetup(context).apply(springSecurity()).build();
    }

    void at(LocalDateTime time) {
        when(checkInClock.instant()).thenReturn(time.toInstant(ZoneOffset.UTC));
    }

    String token() {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                owner.getEmail(), null,
                List.of(new SimpleGrantedAuthority("ROLE_STUDENT"))));
        String value = jwt.generateToken(SecurityContextHolder.getContext().getAuthentication());
        SecurityContextHolder.clearContext();
        return value;
    }

    String staffToken() {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                staff.getEmail(), null,
                List.of(new SimpleGrantedAuthority("ROLE_STAFF"))));
        String value = jwt.generateToken(SecurityContextHolder.getContext().getAuthentication());
        SecurityContextHolder.clearContext();
        return value;
    }

    /** Issues a one-time code as the owning student, exactly like the student QR modal does. */
    String issueTokenFor(Booking target) throws Exception {
        MvcResult issue = mvc.perform(post("/api/bookings/" + target.getId() + "/check-in-token")
                        .header("Authorization", "Bearer " + token()))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(issue.getResponse().getContentAsString()).get("token").asText();
    }

    ResultActions scan(String jwtValue, String body) throws Exception {
        return mvc.perform(post("/api/staff/check-in/scan")
                .header("Authorization", "Bearer " + jwtValue)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body));
    }

    @AfterEach
    void clear() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void issuesHashedTokenAndConsumesItThroughSharedCheckIn() throws Exception {
        String jwtValue = token();
        MvcResult issue = mvc.perform(post("/api/bookings/" + booking.getId() + "/check-in-token")
                        .header("Authorization", "Bearer " + jwtValue))
                .andExpect(status().isOk())
                .andExpect(jsonPath("bookingId").value(booking.getId()))
                .andExpect(jsonPath("token").isString())
                .andExpect(jsonPath("expiresAt").isString())
                .andReturn();
        JsonNode response = objectMapper.readTree(issue.getResponse().getContentAsString());
        String raw = response.get("token").asText();
        CheckInToken stored = tokens.findAll().stream()
                .filter(item -> item.getBookingId().equals(booking.getId())
                        && item.getStatus() == CheckInTokenStatus.ACTIVE)
                .findFirst()
                .orElseThrow();
        org.junit.jupiter.api.Assertions.assertNotEquals(raw, stored.getTokenHash());

        mvc.perform(post("/api/bookings/" + booking.getId() + "/check-in/verify")
                        .header("Authorization", "Bearer " + token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(java.util.Map.of("token", raw))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("status").value("CHECKED_IN"));

        CheckInToken consumed = tokens.findById(stored.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(CheckInTokenStatus.USED, consumed.getStatus());
        org.junit.jupiter.api.Assertions.assertEquals(BookingStatus.CHECKED_IN,
                bookings.findById(booking.getId()).orElseThrow().getStatus());
        org.junit.jupiter.api.Assertions.assertEquals(1, audits.count());
    }

    @Test
    void rejectsWrongAndReplayedTokensWithoutAnotherAudit() throws Exception {
        String jwtValue = token();
        MvcResult issue = mvc.perform(post("/api/bookings/" + booking.getId() + "/check-in-token")
                        .header("Authorization", "Bearer " + jwtValue))
                .andExpect(status().isOk()).andReturn();
        String raw = objectMapper.readTree(issue.getResponse().getContentAsString()).get("token").asText();

        mvc.perform(post("/api/bookings/" + booking.getId() + "/check-in/verify")
                        .header("Authorization", "Bearer " + token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"wrong-token\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("code").value("CHECKIN_TOKEN_INVALID"));

        mvc.perform(post("/api/bookings/" + booking.getId() + "/check-in/verify")
                        .header("Authorization", "Bearer " + token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(java.util.Map.of("token", raw))))
                .andExpect(status().isOk());

        mvc.perform(post("/api/bookings/" + booking.getId() + "/check-in/verify")
                        .header("Authorization", "Bearer " + token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(java.util.Map.of("token", raw))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("code").value("CHECKIN_TOKEN_INVALID"));
        org.junit.jupiter.api.Assertions.assertEquals(1, audits.count());
    }

    @Test
    void doesNotIssueTokenBeforeCheckInWindow() throws Exception {
        at(start.minusMinutes(16));
        mvc.perform(post("/api/bookings/" + booking.getId() + "/check-in-token")
                        .header("Authorization", "Bearer " + token()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("code").value("CHECKIN_TOO_EARLY"));
        org.junit.jupiter.api.Assertions.assertEquals(0, tokens.count());
    }

    @Test
    void staffScansTokenAndRunsTheSharedCheckInCommand() throws Exception {
        String raw = issueTokenFor(booking);

        scan(staffToken(), objectMapper.writeValueAsString(java.util.Map.of("token", raw)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("status").value("CHECKED_IN"))
                .andExpect(jsonPath("id").value(booking.getId()));

        CheckInToken consumed = tokens.findAll().stream()
                .filter(item -> item.getBookingId().equals(booking.getId()))
                .findFirst()
                .orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(CheckInTokenStatus.USED, consumed.getStatus());
        org.junit.jupiter.api.Assertions.assertNotNull(consumed.getUsedAt());

        Booking checkedIn = bookings.findById(booking.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(BookingStatus.CHECKED_IN, checkedIn.getStatus());
        org.junit.jupiter.api.Assertions.assertEquals(staff.getId(), checkedIn.getCheckedInBy());
        org.junit.jupiter.api.Assertions.assertEquals(1, audits.count());
    }

    @Test
    void rejectsWrongReplayedAndBlankScansWithoutExtraAudit() throws Exception {
        String raw = issueTokenFor(booking);

        scan(staffToken(), "{\"token\":\"wrong-token\"}")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("code").value("CHECKIN_TOKEN_INVALID"));

        scan(staffToken(), objectMapper.writeValueAsString(java.util.Map.of("token", raw)))
                .andExpect(status().isOk());

        scan(staffToken(), objectMapper.writeValueAsString(java.util.Map.of("token", raw)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("code").value("CHECKIN_TOKEN_INVALID"));

        scan(staffToken(), "{\"token\":\"   \"}")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("code").value("CHECKIN_TOKEN_INVALID"));

        org.junit.jupiter.api.Assertions.assertEquals(1, audits.count());
    }

    @Test
    void rejectsScanWhenBookingIsNoLongerConfirmed() throws Exception {
        String raw = issueTokenFor(booking);
        booking.setStatus(BookingStatus.CANCELLED);
        bookings.save(booking);

        scan(staffToken(), objectMapper.writeValueAsString(java.util.Map.of("token", raw)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("code").value("INVALID_STATUS_FOR_CHECKIN"));

        org.junit.jupiter.api.Assertions.assertEquals(BookingStatus.CANCELLED,
                bookings.findById(booking.getId()).orElseThrow().getStatus());
        org.junit.jupiter.api.Assertions.assertEquals(0, audits.count());
    }

    @Test
    void rejectsScanAfterCheckInWindowClosed() throws Exception {
        String raw = issueTokenFor(booking);
        at(start.plusMinutes(16));

        scan(staffToken(), objectMapper.writeValueAsString(java.util.Map.of("token", raw)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("code").value("CHECKIN_TOKEN_INVALID"));

        org.junit.jupiter.api.Assertions.assertEquals(BookingStatus.CONFIRMED,
                bookings.findById(booking.getId()).orElseThrow().getStatus());
        org.junit.jupiter.api.Assertions.assertEquals(0, audits.count());
    }

    @Test
    void rejectsScanFromStudent() throws Exception {
        String raw = issueTokenFor(booking);

        scan(token(), objectMapper.writeValueAsString(java.util.Map.of("token", raw)))
                .andExpect(status().isForbidden());

        org.junit.jupiter.api.Assertions.assertEquals(BookingStatus.CONFIRMED,
                bookings.findById(booking.getId()).orElseThrow().getStatus());
        org.junit.jupiter.api.Assertions.assertEquals(0, audits.count());
    }

    @Test
    void scanResolvesTokenIssuedForAnotherBooking() throws Exception {
        Booking other = bookings.save(Booking.builder()
                .studentId(owner.getId())
                .spaceId(2L)
                .participantCount(1)
                .startTime(start)
                .endTime(start.plusHours(1))
                .status(BookingStatus.CONFIRMED)
                .build());
        String raw = issueTokenFor(other);

        scan(staffToken(), objectMapper.writeValueAsString(java.util.Map.of("token", raw)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("id").value(other.getId()))
                .andExpect(jsonPath("status").value("CHECKED_IN"));

        org.junit.jupiter.api.Assertions.assertEquals(BookingStatus.CONFIRMED,
                bookings.findById(booking.getId()).orElseThrow().getStatus());
    }
}
