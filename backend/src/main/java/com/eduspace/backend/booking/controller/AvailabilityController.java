package com.eduspace.backend.booking.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import com.eduspace.backend.booking.dto.request.SearchSpaceFilter;
import com.eduspace.backend.booking.dto.response.AvailabilityResponse;
import com.eduspace.backend.booking.dto.response.SpaceResponse;
import com.eduspace.backend.booking.service.AvailabilityService;

@RestController
@RequestMapping("/api/spaces")
@RequiredArgsConstructor
public class AvailabilityController {

    private final AvailabilityService availabilityService;

    /**
     * Contract chuẩn bắt buộc (02_Yeu_cau_logic §3.1):
     * GET /api/spaces/{spaceId}/availability?startTime={ISO-8601}&endTime={ISO-8601}
     */
    @GetMapping("/{spaceId}/availability")
    public ResponseEntity<AvailabilityResponse> checkAvailability(
            @PathVariable Long spaceId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime) {
        return ResponseEntity.ok(availabilityService.checkSpaceAvailability(spaceId, startTime, endTime));
    }

    /**
     * Tìm kiếm phòng trống theo bộ lọc (03_Phan_tich_nghiep_vu UC-02):
     * GET /api/spaces/available
     */
    @GetMapping("/available")
    public ResponseEntity<List<SpaceResponse>> searchAvailableSpaces(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime startTime,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime endTime,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDateTime,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDateTime,
            @RequestParam(required = false) Integer participantCount,
            @RequestParam(required = false) Long spaceTypeId,
            @RequestParam(required = false) List<Long> facilityIds,
            @RequestParam(required = false) String building) {

        SearchSpaceFilter filter = SearchSpaceFilter.builder()
                .date(date)
                .startTime(startTime)
                .endTime(endTime)
                .startDateTime(startDateTime)
                .endDateTime(endDateTime)
                .participantCount(participantCount)
                .spaceTypeId(spaceTypeId)
                .facilityIds(facilityIds)
                .building(building)
                .build();

        return ResponseEntity.ok(availabilityService.searchAvailableSpaces(filter));
    }

    /*
     * Lưu ý: Các endpoint GET /api/spaces và GET /api/spaces/{id} 
     * được phụ trách chính thức bởi SpaceControllerKT (Module Quản lý Không Gian - Kim Tuyến).
     * Phân hệ AvailabilityController chỉ tập trung vào nghiệp vụ tra cứu khả dụng phòng & ghế trống.
     */


    /**
     * Danh mục loại không gian (hỗ trợ bộ lọc tìm kiếm & hiển thị các chế độ đặt phòng):
     * GET /api/spaces/types
     */
    @GetMapping("/types")
    public ResponseEntity<List<java.util.Map<String, Object>>> getSpaceTypes() {
        return ResponseEntity.ok(availabilityService.getSpaceTypes());
    }

    /**
     * Danh mục tiện ích không gian (hỗ trợ bộ lọc tìm kiếm):
     * GET /api/spaces/facilities
     */
    @GetMapping("/facilities")
    public ResponseEntity<List<java.util.Map<String, Object>>> getFacilities() {
        return ResponseEntity.ok(availabilityService.getFacilities());
    }

    /**
     * Lấy danh sách ghế đang bận theo thời gian thực (MoMo Cinema Seat Selection):
     * GET /api/spaces/{spaceId}/occupied-seats?startTime={ISO-8601}&endTime={ISO-8601}
     */
    @GetMapping("/{spaceId}/occupied-seats")
    public ResponseEntity<List<String>> getOccupiedSeats(
            @PathVariable Long spaceId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime) {
        return ResponseEntity.ok(availabilityService.getOccupiedSeats(spaceId, startTime, endTime));
    }

    /**
     * Thông tin thời gian mở/đóng cửa của tòa nhà và các hạn mức đặt chỗ:
     * GET /api/spaces/operating-hours
     */
    @GetMapping("/operating-hours")
    public ResponseEntity<com.eduspace.backend.policy.dto.response.PolicyResponse> getOperatingHours() {
        return ResponseEntity.ok(availabilityService.getOperatingHours());
    }
}

