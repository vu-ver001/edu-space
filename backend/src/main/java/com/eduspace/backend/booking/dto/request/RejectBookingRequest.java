package com.eduspace.backend.booking.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RejectBookingRequest {
    @NotBlank(message = "Lý do từ chối không được để trống")
    @Size(max = 2000)
    private String rejectReason;
}
