package com.eduspace.backend.space.dto.request;

import com.eduspace.backend.space.entity.SeatStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SeatCreateRequestKT {
    @NotBlank(message = "Mã chỗ không được để trống")
    private String seatCode;

    @Builder.Default
    private SeatStatus status = SeatStatus.AVAILABLE;

    private String description;
}
