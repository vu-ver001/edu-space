package com.eduspace.backend.space.dto.request;

import com.eduspace.backend.space.entity.BookingMode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpaceTypeCreateRequestKT {
    @NotBlank(message = "Tên loại không gian không được để trống")
    private String name;

    private String description;

    @NotNull(message = "Hình thức đặt chỗ không được để trống")
    private BookingMode bookingMode;

    @NotNull(message = "Vui lòng chọn loại không gian có cần duyệt hay không")
    private Boolean requiresApproval;
}
