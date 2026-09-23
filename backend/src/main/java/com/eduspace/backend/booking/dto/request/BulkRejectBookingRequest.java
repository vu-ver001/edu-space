package com.eduspace.backend.booking.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkRejectBookingRequest {

    @NotEmpty(message = "Danh sách bookingIds không được để trống")
    private List<Long> bookingIds;

    @NotBlank(message = "Lý do từ chối không được để trống theo quy tắc R-20")
    @Size(max = 2000, message = "Lý do từ chối tối đa 2000 ký tự")
    private String rejectReason;
}
