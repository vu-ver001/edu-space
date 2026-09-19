package com.eduspace.backend.space.dto.request;

import com.eduspace.backend.space.entity.SpaceStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpaceUpdateRequestKT {

    @NotBlank(message = "Tên không gian không được để trống")
    private String name;

    @NotNull(message = "Loại không gian không được để trống")
    private Long spaceTypeId;

    @NotBlank(message = "Tòa nhà không được để trống")
    private String building;

    @NotBlank(message = "Tầng không được để trống")
    private String floor;

    @NotNull(message = "Sức chứa không được để trống")
    @Min(value = 1, message = "Sức chứa phải lớn hơn 0")
    private Integer capacity;

    @NotNull(message = "Trạng thái không được để trống")
    private SpaceStatus status;

    private String description;

    private List<Long> facilityIds;
}
