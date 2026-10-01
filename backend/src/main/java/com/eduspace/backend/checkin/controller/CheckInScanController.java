package com.eduspace.backend.checkin.controller;

import com.eduspace.backend.booking.dto.response.BookingResponse;
import com.eduspace.backend.checkin.dto.request.VerifyCheckInTokenRequest;
import com.eduspace.backend.checkin.service.CheckInTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Staff-side QR scanning. Lives under /api/staff so it follows the existing staff operation
 * namespace and needs no SecurityConfig rule beyond anyRequest().authenticated().
 */
@RestController
@RequestMapping("/api/staff/check-in")
@PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
@RequiredArgsConstructor
public class CheckInScanController {

    private final CheckInTokenService checkInTokenService;

    /** Consumes a scanned one-time code and runs the shared check-in command. */
    @PostMapping("/scan")
    public ResponseEntity<BookingResponse> scan(@RequestBody(required = false) VerifyCheckInTokenRequest request) {
        String token = request != null ? request.getToken() : null;
        return ResponseEntity.ok(checkInTokenService.scan(token));
    }
}
