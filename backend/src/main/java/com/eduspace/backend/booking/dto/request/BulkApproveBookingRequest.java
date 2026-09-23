package com.eduspace.backend.booking.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkApproveBookingRequest {

    @NotEmpty(message = "Danh sách bookingIds không được để trống")
    private List<Long> bookingIds;
}
