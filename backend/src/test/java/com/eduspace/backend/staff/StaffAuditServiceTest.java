package com.eduspace.backend.staff;

import com.eduspace.backend.auth.entity.User;
import com.eduspace.backend.auth.repository.UserRepository;
import com.eduspace.backend.space.repository.SpaceRepository;
import com.eduspace.backend.staff.entity.StaffAuditAction;
import com.eduspace.backend.staff.entity.StaffAuditLog;
import com.eduspace.backend.staff.repository.StaffAuditLogRepository;
import com.eduspace.backend.staff.service.StaffAuditService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class StaffAuditServiceTest {
    private StaffAuditLogRepository logs;
    private UserRepository users;
    private StaffAuditService service;

    @BeforeEach
    void setUp() {
        logs = mock(StaffAuditLogRepository.class);
        users = mock(UserRepository.class);
        service = new StaffAuditService(logs, users, mock(SpaceRepository.class));
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("staff@example.com", null,
                        List.of(new SimpleGrantedAuthority("ROLE_STAFF"))));
        when(users.findByEmail("staff@example.com"))
                .thenReturn(Optional.of(User.builder().id(7L).email("staff@example.com").build()));
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void legacyListScopesStaffAndCombinesAllFilters() {
        service.getAuditLogs("BOOKING_APPROVED", "BOOKING", 12L, 3L);

        verify(logs).search(eq(StaffAuditAction.BOOKING_APPROVED), eq("BOOKING"),
                eq(12L), eq(3L), eq(7L), isNull(), isNull());
    }

    @Test
    void statisticsIncludeLogsAfterTheFirstHundred() {
        List<StaffAuditLog> records = new ArrayList<>();
        for (int i = 0; i < 150; i++) {
            records.add(StaffAuditLog.builder()
                    .action(i < 100 ? StaffAuditAction.MAINTENANCE_CREATED
                            : StaffAuditAction.BOOKING_APPROVED)
                    .build());
        }
        when(logs.search(isNull(), isNull(), isNull(), isNull(), eq(7L), isNull(), isNull()))
                .thenReturn(records);

        var stats = service.getAuditStats(null, null, null, null, null, null, null, null);

        assertEquals(150, stats.getTotalActions());
        assertEquals(50, stats.getApprovedCount());
        assertEquals(100, stats.getMaintenanceCount());
    }

    @Test
    void dateOnlyToFilterUsesStartOfNextDayAsExclusiveBound() {
        service.searchAuditLogs(null, null, null, null, null, null,
                "2026-10-08", "2026-10-08", 0, 10);

        verify(logs).search(isNull(), isNull(), isNull(), isNull(), eq(7L),
                eq(LocalDateTime.of(2026, 10, 8, 0, 0)),
                eq(LocalDateTime.of(2026, 10, 9, 0, 0)));
    }
}
