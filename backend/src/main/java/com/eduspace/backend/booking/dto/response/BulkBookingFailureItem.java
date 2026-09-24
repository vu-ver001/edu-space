package com.eduspace.backend.booking.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkBookingFailureItem {

    private Long bookingId;
    private String bookingCode;
    private String errorCode;
    private String errorMessage;
}
