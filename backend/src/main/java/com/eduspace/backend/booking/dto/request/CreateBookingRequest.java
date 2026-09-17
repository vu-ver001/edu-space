package com.eduspace.backend.booking.dto.request;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;




@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateBookingRequest {

    @NotNull(message = "Mã phòng không được để trống")
    private Long spaceId;

    @NotNull(message = "Thời gian bắt đầu không được để trống")
    @Future(message = "Thời gian bắt đầu phải lớn hơn thời điểm hiện tại")
    private LocalDateTime startTime;

    @NotNull(message = "Thời gian kết thúc không được để trống")
    private LocalDateTime endTime;

    @NotNull(message = "Số người tham gia không được để trống")
    @Min(value = 1, message = "Số người tham gia phải lớn hơn 0")
    private Integer participantCount;

    private String purpose;

    private java.util.List<String> selectedSeats;
}
