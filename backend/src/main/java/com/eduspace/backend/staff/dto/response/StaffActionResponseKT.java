package com.eduspace.backend.staff.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

/** Phản hồi chuẩn cho các thao tác ghi dữ liệu thuộc module vận hành Staff. */
@Getter
@AllArgsConstructor
public class StaffActionResponseKT<T> {

    private final String message;
    private final T data;

    public static <T> StaffActionResponseKT<T> of(String message, T data) {
        return new StaffActionResponseKT<>(message, data);
    }

    public static StaffActionResponseKT<Void> message(String message) {
        return new StaffActionResponseKT<>(message, null);
    }
}
