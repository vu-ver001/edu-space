package com.eduspace.backend.checkin.controller;

import com.eduspace.backend.booking.dto.response.BookingResponse;
import com.eduspace.backend.checkin.service.CheckInService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class CheckInController {

    private final CheckInService checkInService;

    /** Shared manual check-in endpoint for Student self check-in and Staff/Admin assistance. */
    @PostMapping("/{id}/check-in")
    @PreAuthorize("hasAnyRole('STUDENT', 'STAFF', 'ADMIN')")
    public ResponseEntity<BookingResponse> checkIn(@PathVariable Long id) {
        return ResponseEntity.ok(checkInService.checkIn(id));
    }
}
