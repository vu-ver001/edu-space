package com.eduspace.backend.space.dto.request;

import com.eduspace.backend.space.entity.SpaceTableStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpaceTableCreateRequestKT {

    @NotBlank(message = "Mã bàn không được để trống")
    private String tableCode;

    @NotNull(message = "Sức chứa bàn không được để trống")
    @Positive(message = "Sức chứa bàn phải lớn hơn 0")
    private Integer capacity;

    @Builder.Default
    private SpaceTableStatus status = SpaceTableStatus.AVAILABLE;

    private String description;
}
