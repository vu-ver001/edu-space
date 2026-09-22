package com.eduspace.backend.policy.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PolicyUpdateRequest {

    @NotNull(message = "Hạn mức số booking/ngày không được để trống")
    @Min(value = 1, message = "Hạn mức số booking/ngày phải từ ít nhất là 1")
    @Max(value = 10, message = "Hạn mức số booking/ngày tối đa là 10")
    private Integer maxBookingsPerDay;

    @NotNull(message = "Thời lượng tối đa mỗi lần đặt không được để trống")
    @Min(value = 15, message = "Thời lượng tối đa mỗi lần đặt phải từ 15 phút trở lên")
    @Max(value = 720, message = "Thời lượng tối đa không vượt quá 720 phút (12 giờ)")
    private Integer maxDurationMinutes;

    @NotNull(message = "Khoảng thời gian ân hạn check-in không được để trống")
    @Min(value = 1, message = "Khoảng thời gian ân hạn check-in phải lớn hơn 0 phút")
    @Max(value = 120, message = "Khoảng thời gian ân hạn không được vượt quá 120 phút")
    private Integer checkInGraceMinutes;

    @NotNull(message = "Giới hạn số lần tạo yêu cầu/giờ không được để trống")
    @Min(value = 1, message = "Giới hạn số lần tạo yêu cầu/giờ phải từ ít nhất là 1")
    @Max(value = 100, message = "Giới hạn số lần tạo yêu cầu/giờ tối đa là 100")
    private Integer maxRequestRatePerHour;

    @NotNull(message = "Thời gian mở cửa sổ check-in sớm không được để trống")
    @Min(value = 0, message = "Thời gian mở cửa sổ check-in sớm không được âm")
    @Max(value = 60, message = "Thời gian mở cửa sổ check-in sớm tối đa là 60 phút")
    private Integer checkInEarlyOpenMinutes;

    // Tùy chọn: Nếu Admin truyền mốc đóng cửa sổ check-in, mốc này bắt buộc phải bằng checkInGraceMinutes (Quy tắc R-19)
    private Integer checkInCloseOffsetMinutes;

    // Khung giờ mở cửa & đóng cửa toàn hệ thống (định dạng HH:mm)
    @Pattern(regexp = "^([01]?[0-9]|2[0-3]):[0-5][0-9]$", message = "Giờ mở cửa phải theo định dạng HH:mm (ví dụ 07:00)")
    private String openingHour;

    @Pattern(regexp = "^([01]?[0-9]|2[0-3]):[0-5][0-9]$", message = "Giờ đóng cửa phải theo định dạng HH:mm (ví dụ 22:00)")
    private String closingHour;

    public PolicyUpdateRequest(Integer maxBookingsPerDay, Integer maxDurationMinutes,
                               Integer checkInGraceMinutes, Integer maxRequestRatePerHour,
                               Integer checkInEarlyOpenMinutes, Integer checkInCloseOffsetMinutes) {
        this.maxBookingsPerDay = maxBookingsPerDay;
        this.maxDurationMinutes = maxDurationMinutes;
        this.checkInGraceMinutes = checkInGraceMinutes;
        this.maxRequestRatePerHour = maxRequestRatePerHour;
        this.checkInEarlyOpenMinutes = checkInEarlyOpenMinutes;
        this.checkInCloseOffsetMinutes = checkInCloseOffsetMinutes;
        this.openingHour = "07:00";
        this.closingHour = "22:00";
    }
}
