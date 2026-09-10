package com.eduspace.backend.exception;

import java.util.List;

/**
 * Chuan tra loi chung toa he thong (02_Yeu_cau_logic §12).
 * Mọi API loi nghiep vu tra ve {code, message, details}.
 *
 * TODO(Tan): cong bo danh muc ma loi (BOOKING_TIME_CONFLICT,
 * BOOKING_APPROVAL_EXPIRED, ...) va dung class nay trong
 * GlobalExceptionHandler.
 */
public record ApiError(String code, String message, List<Object> details) {

	public ApiError(String code, String message) {
		this(code, message, List.of());
	}
}
