package com.eduspace.backend.space.controller;

import com.eduspace.backend.space.dto.request.FacilityCreateRequestKT;
import com.eduspace.backend.space.dto.request.FacilityUpdateRequestKT;
import com.eduspace.backend.space.dto.response.FacilityResponseKT;
import com.eduspace.backend.space.service.FacilityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class AdminFacilityControllerKT {

    private final FacilityService facilityService;

    @GetMapping({"/api/admin/facilities", "/api/facilities"})
    public ResponseEntity<List<FacilityResponseKT>> getAllFacilities() {
        return ResponseEntity.ok(facilityService.getAllFacilities());
    }

    @GetMapping({"/api/admin/facilities/{id}", "/api/facilities/{id}"})
    public ResponseEntity<FacilityResponseKT> getFacilityById(@PathVariable Long id) {
        return ResponseEntity.ok(facilityService.getFacilityById(id));
    }

    @PostMapping("/api/admin/facilities")
    public ResponseEntity<FacilityResponseKT> createFacility(@Valid @RequestBody FacilityCreateRequestKT request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(facilityService.createFacility(request));
    }

    @PutMapping("/api/admin/facilities/{id}")
    public ResponseEntity<FacilityResponseKT> updateFacility(
            @PathVariable Long id,
            @Valid @RequestBody FacilityUpdateRequestKT request
    ) {
        return ResponseEntity.ok(facilityService.updateFacility(id, request));
    }

    @DeleteMapping("/api/admin/facilities/{id}")
    public ResponseEntity<Void> deleteFacility(@PathVariable Long id) {
        facilityService.deleteFacility(id);
        return ResponseEntity.noContent().build();
    }
}
