package com.eduspace.backend.space.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpaceImageReorderRequestKT {

    @NotEmpty(message = "Danh sách sắp xếp ảnh không được để trống")
    @Valid
    private List<ImageOrderItemKT> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ImageOrderItemKT {
        @NotNull(message = "Mã ảnh không được để trống")
        private Long imageId;

        @NotNull(message = "Thứ tự sắp xếp không được để trống")
        private Integer sortOrder;
    }
}
