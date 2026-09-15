package com.eduspace.backend.space.controller;

import com.eduspace.backend.space.dto.request.SpaceTableCreateRequestKT;
import com.eduspace.backend.space.dto.request.SpaceTableUpdateRequestKT;
import com.eduspace.backend.space.dto.response.SpaceTableResponseKT;
import com.eduspace.backend.space.service.SpaceTableService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class AdminSpaceTableControllerKT {

    private final SpaceTableService spaceTableService;

    /**
     * Lấy danh sách bàn của một không gian PER_TABLE (Admin)
     * GET /api/admin/spaces/{spaceId}/tables
     */
    @GetMapping("/api/admin/spaces/{spaceId}/tables")
    public ResponseEntity<List<SpaceTableResponseKT>> getTablesBySpace(@PathVariable Long spaceId) {
        return ResponseEntity.ok(spaceTableService.getTablesBySpace(spaceId));
    }

    /**
     * Xem chi tiết một bàn
     * GET /api/admin/tables/{tableId}
     */
    @GetMapping("/api/admin/tables/{tableId}")
    public ResponseEntity<SpaceTableResponseKT> getTableById(@PathVariable Long tableId) {
        return ResponseEntity.ok(spaceTableService.getTableById(tableId));
    }

    /**
     * Tạo một bàn mới cho không gian PER_TABLE
     * POST /api/admin/spaces/{spaceId}/tables
     */
    @PostMapping("/api/admin/spaces/{spaceId}/tables")
    public ResponseEntity<SpaceTableResponseKT> createTable(
            @PathVariable Long spaceId,
            @Valid @RequestBody SpaceTableCreateRequestKT request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(spaceTableService.createTable(spaceId, request));
    }

    /**
     * Cập nhật thông tin bàn
     * PUT /api/admin/tables/{tableId}
     */
    @PutMapping("/api/admin/tables/{tableId}")
    public ResponseEntity<SpaceTableResponseKT> updateTable(
            @PathVariable Long tableId,
            @Valid @RequestBody SpaceTableUpdateRequestKT request
    ) {
        return ResponseEntity.ok(spaceTableService.updateTable(tableId, request));
    }

    /**
     * Xóa mềm một bàn (trả về 204 No Content)
     * DELETE /api/admin/tables/{tableId}
     */
    @DeleteMapping("/api/admin/tables/{tableId}")
    public ResponseEntity<Void> deleteTable(@PathVariable Long tableId) {
        spaceTableService.deleteTable(tableId);
        return ResponseEntity.noContent().build();
    }
}
