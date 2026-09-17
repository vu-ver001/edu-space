package com.eduspace.backend.common.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import org.springframework.http.HttpStatus;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.ArrayList;
import java.util.List;

@RestControllerAdvice
public class BusinessExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiError> handleBusinessException(BusinessException ex) {
        List<Object> details = ex.getDetails() != null ? new ArrayList<>(ex.getDetails()) : List.of();
        ApiError error = new ApiError(ex.getCode(), ex.getMessage(), details);
        return ResponseEntity.status(ex.getStatus()).body(error);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiError> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        String paramName = ex.getName();
        String message = "Tham số [" + paramName + "] có định dạng không hợp lệ. Vui lòng kiểm tra lại (đặc biệt không để khoảng trắng hay ký tự xuống dòng ở cuối).";
        ApiError error = new ApiError("INVALID_PARAMETER_FORMAT", message, List.of());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }
}
