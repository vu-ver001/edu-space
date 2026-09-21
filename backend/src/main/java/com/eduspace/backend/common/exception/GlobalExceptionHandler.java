package com.eduspace.backend.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.ArrayList;
import java.util.List;

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

	@ExceptionHandler(org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class)
	public ResponseEntity<ApiError> handleTypeMismatch(org.springframework.web.method.annotation.MethodArgumentTypeMismatchException ex) {
		String paramName = ex.getName();
		String message = "Tham số [" + paramName + "] có định dạng không hợp lệ. Vui lòng kiểm tra lại (đặc biệt không để khoảng trắng hay ký tự xuống dòng ở cuối).";
		return ResponseEntity.status(HttpStatus.BAD_REQUEST)
				.body(new ApiError("INVALID_PARAMETER_FORMAT", message, List.of()));
	}

	@ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)
	public ResponseEntity<ApiError> handleMessageNotReadable(org.springframework.http.converter.HttpMessageNotReadableException ex) {
		String msg = "Dữ liệu gửi lên không đúng định dạng chuẩn (ví dụ thời gian phải là YYYY-MM-DDTHH:mm:ss).";
		return ResponseEntity.status(HttpStatus.BAD_REQUEST)
				.body(new ApiError("INVALID_FORMAT", msg));
	}

	// ================= BEGIN KT =================

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex) {
		List<Object> details = new ArrayList<>();
		for (org.springframework.validation.FieldError fe : ex.getBindingResult().getFieldErrors()) {
			details.add(fe.getField() + ": " + fe.getDefaultMessage());
		}

		String errorMessage = details.size() > 1
				? "Vui lòng kiểm tra và điền đầy đủ các thông tin bắt buộc."
				: (ex.getBindingResult().getAllErrors().isEmpty()
						? "Dữ liệu không hợp lệ."
						: ex.getBindingResult().getAllErrors().get(0).getDefaultMessage());

		return ResponseEntity.status(HttpStatus.BAD_REQUEST)
				.body(new ApiError("VALIDATION_ERROR", errorMessage, details));
	}

	@ExceptionHandler(AppException.class)
	public ResponseEntity<ApiError> handleAppException(AppException ex) {
		return ResponseEntity.status(ex.getStatus())
				.body(new ApiError(ex.getCode(), ex.getMessage()));
	}

	// ================= END KT =================

	// ================= BEGIN KHANH VAN =================

	@ExceptionHandler(BusinessException.class)
	public ResponseEntity<ApiError> handleBusinessException(BusinessException ex) {
		List<Object> details = ex.getDetails() != null ? new ArrayList<>(ex.getDetails()) : List.of();
		ApiError error = new ApiError(ex.getCode(), ex.getMessage(), details);
		return ResponseEntity.status(ex.getStatus()).body(error);
	}

	// ================= END KHANH VAN =================

	@ExceptionHandler(org.springframework.web.servlet.resource.NoResourceFoundException.class)
	public ResponseEntity<ApiError> handleNotFound(org.springframework.web.servlet.resource.NoResourceFoundException ex) {
		return ResponseEntity.status(HttpStatus.NOT_FOUND)
				.body(new ApiError("NOT_FOUND", "Đường dẫn không tồn tại: " + ex.getResourcePath()));
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ApiError> handleUnknown(Exception ex) {
		ex.printStackTrace();
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
				.body(new ApiError("INTERNAL_ERROR", "Loi he thong chua xu ly: " + ex.getMessage()));
	}
}
