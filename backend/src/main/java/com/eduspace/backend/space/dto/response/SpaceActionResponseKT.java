package com.eduspace.backend.space.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Phản hồi chuẩn cho các thao tác ghi dữ liệu của module quản lý không gian.
 * GET vẫn trả trực tiếp tài nguyên; POST/PUT/DELETE trả message và dữ liệu mới nhất.
 */
@Getter
@AllArgsConstructor
public class SpaceActionResponseKT<T> {

    private final String message;
    private final T data;

    public static <T> SpaceActionResponseKT<T> of(String message, T data) {
        return new SpaceActionResponseKT<>(message, data);
    }

    public static SpaceActionResponseKT<Void> message(String message) {
        return new SpaceActionResponseKT<>(message, null);
    }
}
