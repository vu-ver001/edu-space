package com.eduspace.backend.staff.controller;

import com.eduspace.backend.staff.dto.request.MaintenanceCreateRequestKT;
import com.eduspace.backend.staff.dto.request.MaintenanceUpdateRequestKT;
import com.eduspace.backend.staff.dto.response.MaintenanceResponseKT;
import com.eduspace.backend.staff.service.MaintenanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/staff")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
public class StaffMaintenanceControllerKT {

    private final MaintenanceService maintenanceService;

    /**
     * Tạo khoảng bảo trì không gian (Staff/Admin).
     * POST /api/staff/spaces/{spaceId}/maintenance
     */
    @PostMapping("/spaces/{spaceId}/maintenance")
    public ResponseEntity<MaintenanceResponseKT> createMaintenance(
            @PathVariable Long spaceId,
            @Valid @RequestBody MaintenanceCreateRequestKT request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(maintenanceService.createMaintenance(spaceId, request));
    }

    /**
     * Cập nhật khoảng bảo trì.
     * PUT /api/staff/maintenance/{maintenanceId}
     */
    @PutMapping("/maintenance/{maintenanceId}")
    public ResponseEntity<MaintenanceResponseKT> updateMaintenance(
            @PathVariable Long maintenanceId,
            @Valid @RequestBody MaintenanceUpdateRequestKT request) {
        return ResponseEntity.ok(maintenanceService.updateMaintenance(maintenanceId, request));
    }

    /**
     * Xóa mềm khoảng bảo trì (Soft delete: deleted_at = now).
     * DELETE /api/staff/maintenance/{maintenanceId}
     */
    @DeleteMapping("/maintenance/{maintenanceId}")
    public ResponseEntity<Void> deleteMaintenance(@PathVariable Long maintenanceId) {
        maintenanceService.deleteMaintenance(maintenanceId);
        return ResponseEntity.noContent().build();
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
