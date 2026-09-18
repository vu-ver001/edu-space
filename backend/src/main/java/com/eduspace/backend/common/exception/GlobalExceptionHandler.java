package com.eduspace.backend.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
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

	@ExceptionHandler(BadCredentialsException.class)
	public ResponseEntity<ApiError> handleBadCredentials(BadCredentialsException ex) {
		return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
				.body(new ApiError("UNAUTHORIZED", "Sai email hoặc mật khẩu."));
	}

	@ExceptionHandler(AuthenticationException.class)
	public ResponseEntity<ApiError> handleAuthentication(AuthenticationException ex) {
		return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
				.body(new ApiError("UNAUTHORIZED", "Vui lòng đăng nhập để thực hiện chức năng này."));
	}

	@ExceptionHandler(AccessDeniedException.class)
	public ResponseEntity<ApiError> handleAccessDenied(AccessDeniedException ex) {
		return ResponseEntity.status(HttpStatus.FORBIDDEN)
				.body(new ApiError("FORBIDDEN", "Bạn không có quyền truy cập tài nguyên này."));
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex) {
		String errorMessage = ex.getBindingResult().getAllErrors().get(0).getDefaultMessage();

		return ResponseEntity.status(HttpStatus.BAD_REQUEST)
				.body(new ApiError("VALIDATION_ERROR", errorMessage));
	}

	// ================= BEGIN KT =================

	@ExceptionHandler(AppException.class)
	public ResponseEntity<ApiError> handleAppException(AppException ex) {
		return ResponseEntity.status(ex.getStatus())
				.body(new ApiError(ex.getCode(), ex.getMessage()));
	}

	// ================= END KT =================

	// ================= BEGIN KHANH VAN =================

	@ExceptionHandler(BusinessException.class)
	public ResponseEntity<ApiError> handleBusinessException(BusinessException ex) {
		java.util.List<Object> details = ex.getDetails() != null ? new java.util.ArrayList<>(ex.getDetails()) : java.util.List.of();
		ApiError error = new ApiError(ex.getCode(), ex.getMessage(), details);
		return ResponseEntity.status(ex.getStatus()).body(error);
	}

	@ExceptionHandler(org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class)
	public ResponseEntity<ApiError> handleTypeMismatch(org.springframework.web.method.annotation.MethodArgumentTypeMismatchException ex) {
		String paramName = ex.getName();
		String message = "Tham số [" + paramName + "] có định dạng không hợp lệ. Vui lòng kiểm tra lại (đặc biệt không để khoảng trắng hay ký tự xuống dòng ở cuối).";
		ApiError error = new ApiError("INVALID_PARAMETER_FORMAT", message, java.util.List.of());
		return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
	}

	// ================= END KHANH VAN =================

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ApiError> handleUnknown(Exception ex) {
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
				.body(new ApiError("INTERNAL_ERROR", "Loi he thong chua xu ly."));
	}
}
