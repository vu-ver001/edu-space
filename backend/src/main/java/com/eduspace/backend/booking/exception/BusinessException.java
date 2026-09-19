package com.eduspace.backend.booking.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import java.util.List;

@Getter
public class BusinessException extends RuntimeException {

    private final String code;
    private final HttpStatus status;
    private final List<?> details;

    public BusinessException(String code, String message, HttpStatus status, List<?> details) {
        super(message);
        this.code = code;
        this.status = status;
        this.details = details;
    }

    public BusinessException(String code, String message, HttpStatus status) {
        this(code, message, status, List.of());
    }

    public static BusinessException badRequest(String code, String message) {
        return new BusinessException(code, message, HttpStatus.BAD_REQUEST);
    }

    public static BusinessException notFound(String code, String message) {
        return new BusinessException(code, message, HttpStatus.NOT_FOUND);
    }

    public static BusinessException conflict(String code, String message) {
        return new BusinessException(code, message, HttpStatus.CONFLICT);
    }

    public static BusinessException conflict(String code, String message, List<?> details) {
        return new BusinessException(code, message, HttpStatus.CONFLICT, details);
    }

    public static BusinessException forbidden(String code, String message) {
        return new BusinessException(code, message, HttpStatus.FORBIDDEN);
    }
}
