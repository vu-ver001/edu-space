package com.eduspace.backend.exception;

import java.util.Collections;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Chuan tra loi chung toa he thong (02_Yeu_cau_logic §12).
 * Moi API loi nghiep vu tra ve {code, message, details}.
 *
 * TODO(Tan): cong bo danh muc ma loi (BOOKING_TIME_CONFLICT,
 * BOOKING_APPROVAL_EXPIRED, ...) va dung class nay trong
 * GlobalExceptionHandler.
 */
@Data
@AllArgsConstructor
public class ApiError {

	private String code;
	private String message;
	private List<Object> details;

	public ApiError(String code, String message) {
		this(code, message, Collections.emptyList());
	}
}
