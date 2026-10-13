package com.eduspace.backend.common.exception;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.*;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    @DisplayName("Case 1: 404 - SEAT_NOT_FOUND")
    void testHandleAppException_NotFound() {
        AppException ex = new AppException(HttpStatus.NOT_FOUND, "SEAT_NOT_FOUND", "Không tìm thấy chỗ ngồi với id: 999999");
        ResponseEntity<ApiError> response = handler.handleAppException(ex);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("SEAT_NOT_FOUND", response.getBody().getCode());
        assertEquals("Không tìm thấy chỗ ngồi với id: 999999", response.getBody().getMessage());
    }

    @Test
    @DisplayName("Case 2: 409 - SEAT_CODE_EXISTS")
    void testHandleAppException_Conflict() {
        AppException ex = new AppException(HttpStatus.CONFLICT, "SEAT_CODE_EXISTS", "Mã chỗ 'S01' đã tồn tại trong không gian này.");
        ResponseEntity<ApiError> response = handler.handleAppException(ex);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("SEAT_CODE_EXISTS", response.getBody().getCode());
        assertEquals("Mã chỗ 'S01' đã tồn tại trong không gian này.", response.getBody().getMessage());
    }

    @Test
    @DisplayName("Case 3: 400 - VALIDATION_ERROR")
    void testHandleAppException_ValidationError() {
        AppException ex = new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Mã chỗ không được để trống.");
        ResponseEntity<ApiError> response = handler.handleAppException(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("VALIDATION_ERROR", response.getBody().getCode());
        assertEquals("Mã chỗ không được để trống.", response.getBody().getMessage());
    }
}
