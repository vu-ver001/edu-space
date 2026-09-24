package com.eduspace.backend.space.controller;

import com.eduspace.backend.space.dto.request.SpaceTypeCreateRequestKT;
import com.eduspace.backend.space.dto.request.SpaceTypeUpdateRequestKT;
import com.eduspace.backend.space.dto.response.SpaceTypeResponseKT;
import com.eduspace.backend.space.dto.response.SpaceActionResponseKT;
import com.eduspace.backend.space.service.SpaceTypeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class AdminSpaceTypeControllerKT {

    private final SpaceTypeService spaceTypeService;

    @GetMapping({"/api/admin/space-types", "/api/space-types"})
    public ResponseEntity<List<SpaceTypeResponseKT>> getAllSpaceTypes() {
        return ResponseEntity.ok(spaceTypeService.getAllSpaceTypes());
    }

    @GetMapping({"/api/admin/space-types/{id}", "/api/space-types/{id}"})
    public ResponseEntity<SpaceTypeResponseKT> getSpaceTypeById(@PathVariable Long id) {
        return ResponseEntity.ok(spaceTypeService.getSpaceTypeById(id));
    }

    @PostMapping("/api/admin/space-types")
    public ResponseEntity<SpaceActionResponseKT<SpaceTypeResponseKT>> createSpaceType(
            @Valid @RequestBody SpaceTypeCreateRequestKT request) {
        SpaceTypeResponseKT created = spaceTypeService.createSpaceType(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(SpaceActionResponseKT.of("Đã tạo loại không gian thành công.", created));
    }

    @PutMapping("/api/admin/space-types/{id}")
    public ResponseEntity<SpaceActionResponseKT<SpaceTypeResponseKT>> updateSpaceType(
            @PathVariable Long id,
            @Valid @RequestBody SpaceTypeUpdateRequestKT request
    ) {
        SpaceTypeResponseKT updated = spaceTypeService.updateSpaceType(id, request);
        return ResponseEntity.ok(SpaceActionResponseKT.of(
                "Đã cập nhật loại không gian thành công.", updated));
    }

    @DeleteMapping("/api/admin/space-types/{id}")
    public ResponseEntity<SpaceActionResponseKT<Void>> deleteSpaceType(@PathVariable Long id) {
        spaceTypeService.deleteSpaceType(id);
        return ResponseEntity.ok(SpaceActionResponseKT.message("Đã xóa loại không gian thành công."));
    }
}
