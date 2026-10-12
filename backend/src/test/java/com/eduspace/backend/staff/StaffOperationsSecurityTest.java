package com.eduspace.backend.staff;

import com.eduspace.backend.auth.entity.Role;
import com.eduspace.backend.auth.entity.User;
import com.eduspace.backend.auth.repository.UserRepository;
import com.eduspace.backend.auth.security.JwtTokenProvider;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.context.WebApplicationContext;

import java.util.List;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.setup.MockMvcBuilders.webAppContextSetup;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:staffsec;MODE=MySQL;DB_CLOSE_DELAY=-1;LOCK_TIMEOUT=5000",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "booking.scheduler.enabled=false"
})
class StaffOperationsSecurityTest {

    @Autowired UserRepository users;
    @Autowired JwtTokenProvider jwt;
    @Autowired WebApplicationContext context;

    MockMvc mvc;
    User admin;
    User staff;
    User student;

    @BeforeEach
    void setUp() {
        users.deleteAll();
        admin = users.save(User.builder()
                .email("sec-admin@example.com")
                .password("pwd")
                .fullName("Sec Admin")
                .role(Role.ADMIN)
                .active(true)
                .build());

        staff = users.save(User.builder()
                .email("sec-staff@example.com")
                .password("pwd")
                .fullName("Sec Staff")
                .role(Role.STAFF)
                .active(true)
                .build());

        student = users.save(User.builder()
                .email("sec-student@example.com")
                .password("pwd")
                .fullName("Sec Student")
                .role(Role.STUDENT)
                .active(true)
                .build());

        mvc = webAppContextSetup(context).apply(springSecurity()).build();
    }

    @AfterEach
    void clean() {
        SecurityContextHolder.clearContext();
    }

    private String tokenFor(User user, String role) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                user.getEmail(), null,
                List.of(new SimpleGrantedAuthority("ROLE_" + role))));
        String token = jwt.generateToken(SecurityContextHolder.getContext().getAuthentication());
        SecurityContextHolder.clearContext();
        return token;
    }

    @Test
    void adminCanAccessAuditLogsAndStats() throws Exception {
        String adminToken = tokenFor(admin, "ADMIN");

        mvc.perform(get("/api/staff/audit-logs")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        mvc.perform(get("/api/staff/audit-logs/stats")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
    }

    @Test
    void adminCannotAccessStaffOperationalActions() throws Exception {
        String adminToken = tokenFor(admin, "ADMIN");

        // Admin must be forbidden from staff bookings list, approvals, rejections, check-in
        mvc.perform(get("/api/staff/bookings")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isForbidden());

        mvc.perform(get("/api/staff/bookings/pending")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isForbidden());

        mvc.perform(post("/api/staff/bookings/1/approve")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isForbidden());

        mvc.perform(post("/api/staff/bookings/1/reject")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType("application/json")
                        .content("{\"reason\":\"test\"}"))
                .andExpect(status().isForbidden());

        mvc.perform(post("/api/staff/bookings/1/check-in")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void studentIsForbiddenFromAllStaffEndpoints() throws Exception {
        String studentToken = tokenFor(student, "STUDENT");

        mvc.perform(get("/api/staff/audit-logs")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());

        mvc.perform(get("/api/staff/audit-logs/stats")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());

        mvc.perform(get("/api/staff/spaces/1/timeline?from=2026-10-13T08:00:00&to=2026-10-13T22:00:00")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());

        mvc.perform(get("/api/staff/bookings")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void staffCanAccessBothOperationsAndAuditLogs() throws Exception {
        String staffToken = tokenFor(staff, "STAFF");

        mvc.perform(get("/api/staff/audit-logs")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk());

        mvc.perform(get("/api/staff/audit-logs/stats")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk());

        mvc.perform(get("/api/staff/bookings")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk());

        mvc.perform(get("/api/staff/bookings/pending")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk());
    }
}
