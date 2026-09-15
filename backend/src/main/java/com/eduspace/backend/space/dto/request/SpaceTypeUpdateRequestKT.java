package com.eduspace.backend.space.dto.request;

import com.eduspace.backend.space.entity.BookingMode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpaceTypeUpdateRequestKT {
    @NotBlank(message = "Tên loại phòng không được để trống")
    private String name;

    private String description;

    @NotNull(message = "Kiểu đặt phòng không được để trống")
    private BookingMode bookingMode;

    @NotNull(message = "Trường requiresApproval không được để trống")
    private Boolean requiresApproval;
}
