package com.eduspace.backend.staff.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaintenanceUpdateRequestKT {

    @NotNull(message = "Thời gian bắt đầu bảo trì không được để trống")
    private LocalDateTime startTime;

    @NotNull(message = "Thời gian kết thúc bảo trì không được để trống")
    private LocalDateTime endTime;

    @NotBlank(message = "Lý do bảo trì không được để trống")
    @Size(max = 255, message = "Lý do bảo trì không được vượt quá 255 ký tự")
    private String reason;
}
