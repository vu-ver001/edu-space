package com.eduspace.backend.space.controller;

import com.eduspace.backend.space.dto.request.SpaceCreateRequestKT;
import com.eduspace.backend.space.dto.request.SpaceUpdateRequestKT;
import com.eduspace.backend.space.dto.response.SpaceResponseKT;
import com.eduspace.backend.space.dto.response.SpaceActionResponseKT;
import com.eduspace.backend.space.service.SpaceService;
import com.eduspace.backend.staff.dto.response.MaintenanceResponseKT;
import com.eduspace.backend.staff.dto.response.StaffTimelineResponseKT;
import com.eduspace.backend.staff.service.MaintenanceService;
import com.eduspace.backend.staff.service.StaffOperationsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/admin/spaces")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminSpaceControllerKT {

    private final SpaceService spaceService;
    private final MaintenanceService maintenanceService;
    private final StaffOperationsService staffOperationsService;

    @GetMapping
    public ResponseEntity<List<SpaceResponseKT>> getAllSpaces() {
        return ResponseEntity.ok(spaceService.getAllSpaces());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SpaceResponseKT> getSpaceById(@PathVariable Long id) {
        return ResponseEntity.ok(spaceService.getSpaceById(id));
    }

    /**
     * Dữ liệu bảo trì phục vụ riêng màn hình chi tiết không gian của Admin.
     */
    @GetMapping("/{id}/maintenance")
    public ResponseEntity<List<MaintenanceResponseKT>> getMaintenanceBySpace(@PathVariable Long id) {
        return ResponseEntity.ok(maintenanceService.getMaintenanceBySpace(id));
    }

    /**
     * Timeline chỉ đọc phục vụ Admin kiểm tra tình trạng bàn/ghế của không gian.
     */
    @GetMapping("/{id}/timeline")
    public ResponseEntity<StaffTimelineResponseKT> getSpaceTimeline(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        return ResponseEntity.ok(staffOperationsService.getSpaceTimeline(id, from, to));
    }

    @PostMapping
    public ResponseEntity<SpaceActionResponseKT<SpaceResponseKT>> createSpace(
            @Valid @RequestBody SpaceCreateRequestKT request) {
        SpaceResponseKT created = spaceService.createSpace(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(SpaceActionResponseKT.of("Đã tạo không gian thành công.", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SpaceActionResponseKT<SpaceResponseKT>> updateSpace(
            @PathVariable Long id,
            @Valid @RequestBody SpaceUpdateRequestKT request
    ) {
        SpaceResponseKT updated = spaceService.updateSpace(id, request);
        return ResponseEntity.ok(SpaceActionResponseKT.of("Đã cập nhật không gian thành công.", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<SpaceActionResponseKT<Void>> deleteSpace(@PathVariable Long id) {
        spaceService.deleteSpace(id);
        return ResponseEntity.ok(SpaceActionResponseKT.message("Đã xóa không gian thành công."));
    }
}
