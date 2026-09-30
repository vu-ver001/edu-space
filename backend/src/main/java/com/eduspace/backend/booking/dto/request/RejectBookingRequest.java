package com.eduspace.backend.booking.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RejectBookingRequest {

    @NotBlank(message = "Lý do từ chối không được để trống theo quy tắc R-20")
    @Size(max = 2000, message = "Lý do từ chối không được vượt quá 2000 ký tự")
    private String rejectReason;
}

