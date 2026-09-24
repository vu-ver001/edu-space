package com.eduspace.backend.staff.exception;

import com.eduspace.backend.booking.dto.response.BookingResponse;
import com.eduspace.backend.common.exception.AppException;
import lombok.Getter;
import org.springframework.http.HttpStatus;

import java.util.List;

/**
 * Lỗi riêng của module bảo trì, giữ danh sách booking đang xung đột để client
 * có thể hiển thị thông tin cụ thể thay vì chỉ nhận một thông báo chung.
 */
@Getter
public class MaintenanceBookingConflictExceptionKT extends AppException {

    private final List<BookingResponse> conflictingBookings;

    public MaintenanceBookingConflictExceptionKT(List<BookingResponse> conflictingBookings) {
        super(
                HttpStatus.CONFLICT,
                "SPACE_HAS_OCCUPYING_BOOKING",
                "Không thể lưu lịch bảo trì vì không gian đã có đặt chỗ trong khoảng thời gian này."
        );
        this.conflictingBookings = List.copyOf(conflictingBookings);
    }
}
