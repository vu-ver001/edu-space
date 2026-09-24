package com.eduspace.backend.booking.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkBookingOperationResponse {

    private int totalRequested;
    private int successCount;
    private int failureCount;

    @Builder.Default
    private List<BookingResponse> successfulBookings = new ArrayList<>();

    @Builder.Default
    private List<BulkBookingFailureItem> failedBookings = new ArrayList<>();
}
