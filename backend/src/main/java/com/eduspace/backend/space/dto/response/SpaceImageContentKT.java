package com.eduspace.backend.space.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

/** Nội dung file ảnh được đọc trực tiếp từ bảng space_images. */
@Getter
@AllArgsConstructor
public class SpaceImageContentKT {

    private final byte[] data;
    private final String contentType;
    private final String originalFileName;
}
