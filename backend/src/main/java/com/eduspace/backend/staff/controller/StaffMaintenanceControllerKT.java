package com.eduspace.backend.staff.controller;

import com.eduspace.backend.common.exception.ApiError;
import com.eduspace.backend.staff.dto.request.MaintenanceCreateRequestKT;
import com.eduspace.backend.staff.dto.request.MaintenanceUpdateRequestKT;
import com.eduspace.backend.staff.dto.response.MaintenanceResponseKT;
import com.eduspace.backend.staff.dto.response.StaffActionResponseKT;
import com.eduspace.backend.staff.exception.MaintenanceBookingConflictExceptionKT;
import com.eduspace.backend.staff.service.MaintenanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/staff")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
public class StaffMaintenanceControllerKT {

    private final MaintenanceService maintenanceService;

    @ExceptionHandler(MaintenanceBookingConflictExceptionKT.class)
    public ResponseEntity<ApiError> handleMaintenanceBookingConflict(
            MaintenanceBookingConflictExceptionKT exception) {
        return ResponseEntity.status(exception.getStatus())
                .body(new ApiError(
                        exception.getCode(),
                        exception.getMessage(),
                        new ArrayList<>(exception.getConflictingBookings())
                ));
    }

    /**
     * Tạo khoảng bảo trì không gian (Staff/Admin).
     * POST /api/staff/spaces/{spaceId}/maintenance
     */
    @PostMapping("/spaces/{spaceId}/maintenance")
    public ResponseEntity<StaffActionResponseKT<MaintenanceResponseKT>> createMaintenance(
            @PathVariable Long spaceId,
            @Valid @RequestBody MaintenanceCreateRequestKT request) {
        MaintenanceResponseKT created = maintenanceService.createMaintenance(spaceId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(StaffActionResponseKT.of("Đã tạo khoảng bảo trì thành công.", created));
    }

    /**
     * Cập nhật khoảng bảo trì.
     * PUT /api/staff/maintenance/{maintenanceId}
     */
    @PutMapping("/maintenance/{maintenanceId}")
    public ResponseEntity<StaffActionResponseKT<MaintenanceResponseKT>> updateMaintenance(
            @PathVariable Long maintenanceId,
            @Valid @RequestBody MaintenanceUpdateRequestKT request) {
        MaintenanceResponseKT updated = maintenanceService.updateMaintenance(maintenanceId, request);
        return ResponseEntity.ok(StaffActionResponseKT.of(
                "Đã cập nhật khoảng bảo trì thành công.", updated));
    }

    /**
     * Xóa mềm khoảng bảo trì (Soft delete: deleted_at = now).
     * DELETE /api/staff/maintenance/{maintenanceId}
     */
    @DeleteMapping("/maintenance/{maintenanceId}")
    public ResponseEntity<StaffActionResponseKT<Void>> deleteMaintenance(@PathVariable Long maintenanceId) {
        maintenanceService.deleteMaintenance(maintenanceId);
        return ResponseEntity.ok(StaffActionResponseKT.message("Đã hủy khoảng bảo trì thành công."));
    }

    /**
     * Lấy danh sách khoảng bảo trì đang active của một không gian.
     * GET /api/staff/spaces/{spaceId}/maintenance
     */
    @GetMapping("/spaces/{spaceId}/maintenance")
    public ResponseEntity<List<MaintenanceResponseKT>> getMaintenanceBySpace(@PathVariable Long spaceId) {
        return ResponseEntity.ok(maintenanceService.getMaintenanceBySpace(spaceId));
    }

    /**
     * Xem chi tiết một khoảng bảo trì.
     * GET /api/staff/maintenance/{maintenanceId}
     */
    @GetMapping("/maintenance/{maintenanceId}")
    public ResponseEntity<MaintenanceResponseKT> getMaintenanceById(@PathVariable Long maintenanceId) {
        return ResponseEntity.ok(maintenanceService.getMaintenanceById(maintenanceId));
    }
}
