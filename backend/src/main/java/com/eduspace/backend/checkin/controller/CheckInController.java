package com.eduspace.backend.checkin.controller;

import com.eduspace.backend.booking.dto.response.BookingResponse;
import com.eduspace.backend.checkin.dto.request.VerifyCheckInTokenRequest;
import com.eduspace.backend.checkin.dto.response.CheckInTokenResponse;
import com.eduspace.backend.checkin.service.CheckInService;
import com.eduspace.backend.checkin.service.CheckInTokenService;
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
    private final CheckInTokenService checkInTokenService;

    /** Shared manual check-in endpoint for Student self check-in and Staff/Admin assistance. */
    @PostMapping("/{id}/check-in")
    @PreAuthorize("hasAnyRole('STUDENT', 'STAFF', 'ADMIN')")
    public ResponseEntity<BookingResponse> checkIn(@PathVariable Long id) {
        return ResponseEntity.ok(checkInService.checkIn(id));
    }

    /** Issues a short-lived raw token for the owner to display as QR/text. */
    @PostMapping("/{id}/check-in-token")
    @PreAuthorize("hasAnyRole('STUDENT', 'STAFF', 'ADMIN')")
    public ResponseEntity<CheckInTokenResponse> issueToken(@PathVariable Long id) {
        return ResponseEntity.ok(checkInTokenService.issue(id));
    }

    /** Verifies and consumes a token, then executes the shared check-in command. */
    @PostMapping("/{id}/check-in/verify")
    @PreAuthorize("hasAnyRole('STUDENT', 'STAFF', 'ADMIN')")
    public ResponseEntity<BookingResponse> verifyToken(
            @PathVariable Long id,
            @org.springframework.web.bind.annotation.RequestBody VerifyCheckInTokenRequest request) {
        return ResponseEntity.ok(checkInTokenService.verify(id, request != null ? request.getToken() : null));
    }
}
