package com.eduspace.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Xu ly loi tap trung, tra ve dung ma HTTP chuan:
 * 400 validate, 401 chua dang nhap, 403 sai quyen, 404 khong thay, 409 xung dot.
 *
 * TODO(Tan): bo sung handler cho 401/403/409 nghiep vu + map tu BusinessException.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex) {
		return ResponseEntity.status(HttpStatus.BAD_REQUEST)
				.body(new ApiError("VALIDATION_ERROR", "Du lieu dau vao khong hop le."));
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ApiError> handleUnknown(Exception ex) {
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
				.body(new ApiError("INTERNAL_ERROR", "Loi he thong chua xu ly."));
	}
}
