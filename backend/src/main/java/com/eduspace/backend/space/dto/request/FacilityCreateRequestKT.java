package com.eduspace.backend.space.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FacilityCreateRequestKT {
    @NotBlank(message = "Tên tiện ích không được để trống")
    private String name;

    private String description;
}
