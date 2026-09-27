package com.eduspace.backend.checkin.dto.response;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** The raw token is returned only at issuance time so it can be shown as QR/text. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckInTokenResponse {
    private Long bookingId;
    private String token;
    private LocalDateTime issuedAt;
    private LocalDateTime expiresAt;
}
