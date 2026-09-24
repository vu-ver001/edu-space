package com.eduspace.backend.space.controller;

import com.eduspace.backend.space.dto.request.SeatBulkCreateRequestKT;
import com.eduspace.backend.space.dto.request.SeatCreateRequestKT;
import com.eduspace.backend.space.dto.request.SeatUpdateRequestKT;
import com.eduspace.backend.space.dto.response.SeatResponseKT;
import com.eduspace.backend.space.dto.response.SpaceActionResponseKT;
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
    public ResponseEntity<SpaceActionResponseKT<SeatResponseKT>> createSeat(
            @PathVariable Long spaceId,
            @Valid @RequestBody SeatCreateRequestKT request
    ) {
        SeatResponseKT created = seatService.createSeat(spaceId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(SpaceActionResponseKT.of("Đã tạo chỗ ngồi thành công.", created));
    }

    /**
     * Tạo hàng loạt chỗ ngồi cho không gian
     */
    @PostMapping("/api/admin/spaces/{spaceId}/seats/bulk")
    public ResponseEntity<SpaceActionResponseKT<List<SeatResponseKT>>> bulkCreateSeats(
            @PathVariable Long spaceId,
            @Valid @RequestBody SeatBulkCreateRequestKT request
    ) {
        List<SeatResponseKT> created = seatService.bulkCreateSeats(spaceId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(SpaceActionResponseKT.of(
                        "Đã tạo " + created.size() + " chỗ ngồi thành công.", created));
    }

    /**
     * Cập nhật thông tin chỗ ngồi
     */
    @PutMapping("/api/admin/seats/{seatId}")
    public ResponseEntity<SpaceActionResponseKT<SeatResponseKT>> updateSeat(
            @PathVariable Long seatId,
            @Valid @RequestBody SeatUpdateRequestKT request
    ) {
        SeatResponseKT updated = seatService.updateSeat(seatId, request);
        return ResponseEntity.ok(SpaceActionResponseKT.of("Đã cập nhật chỗ ngồi thành công.", updated));
    }

    /**
     * Xóa mềm một chỗ ngồi và trả thông báo cho client.
     */
    @DeleteMapping("/api/admin/seats/{seatId}")
    public ResponseEntity<SpaceActionResponseKT<Void>> deleteSeat(@PathVariable Long seatId) {
        seatService.deleteSeat(seatId);
        return ResponseEntity.ok(SpaceActionResponseKT.message("Đã xóa chỗ ngồi thành công."));
    }
}
