package com.eduspace.backend.space.controller;

import com.eduspace.backend.space.dto.request.SeatBulkCreateRequestKT;
import com.eduspace.backend.space.dto.request.SeatCreateRequestKT;
import com.eduspace.backend.space.dto.request.SeatUpdateRequestKT;
import com.eduspace.backend.space.dto.response.SeatResponseKT;
import com.eduspace.backend.space.service.SeatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class AdminSeatControllerKT {

    private final SeatService seatService;

    /**
     * Lấy danh sách chỗ ngồi của một không gian PER_SEAT (Admin)
     */
    @GetMapping("/api/admin/spaces/{spaceId}/seats")
    public ResponseEntity<List<SeatResponseKT>> getSeatsBySpace(@PathVariable Long spaceId) {
        return ResponseEntity.ok(seatService.getSeatsBySpace(spaceId));
    }

    /**
     * Xem chi tiết một chỗ ngồi
     */
    @GetMapping("/api/admin/seats/{seatId}")
    public ResponseEntity<SeatResponseKT> getSeatById(@PathVariable Long seatId) {
        return ResponseEntity.ok(seatService.getSeatById(seatId));
    }

    /**
     * Tạo một chỗ ngồi mới cho không gian
     */
    @PostMapping("/api/admin/spaces/{spaceId}/seats")
    public ResponseEntity<SeatResponseKT> createSeat(
            @PathVariable Long spaceId,
            @Valid @RequestBody SeatCreateRequestKT request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(seatService.createSeat(spaceId, request));
    }

    /**
     * Tạo hàng loạt chỗ ngồi cho không gian
     */
    @PostMapping("/api/admin/spaces/{spaceId}/seats/bulk")
    public ResponseEntity<List<SeatResponseKT>> bulkCreateSeats(
            @PathVariable Long spaceId,
            @Valid @RequestBody SeatBulkCreateRequestKT request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(seatService.bulkCreateSeats(spaceId, request));
    }

    /**
     * Cập nhật thông tin chỗ ngồi
     */
    @PutMapping("/api/admin/seats/{seatId}")
    public ResponseEntity<SeatResponseKT> updateSeat(
            @PathVariable Long seatId,
            @Valid @RequestBody SeatUpdateRequestKT request
    ) {
        return ResponseEntity.ok(seatService.updateSeat(seatId, request));
    }

    /**
     * Xóa mềm một chỗ ngồi (trả về 204 No Content)
     */
    @DeleteMapping("/api/admin/seats/{seatId}")
    public ResponseEntity<Void> deleteSeat(@PathVariable Long seatId) {
        seatService.deleteSeat(seatId);
        return ResponseEntity.noContent().build();
    }
}
