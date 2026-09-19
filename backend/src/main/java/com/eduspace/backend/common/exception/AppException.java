package com.eduspace.backend.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class AppException extends RuntimeException {

    // ================= BEGIN KT =================

    private final HttpStatus status;
    private final String code;

    public AppException(
            HttpStatus status,
            String code,
            String message
    ) {
        super(message);
        this.status = status;
        this.code = code;
    }

    // ================= END KT =================
}
