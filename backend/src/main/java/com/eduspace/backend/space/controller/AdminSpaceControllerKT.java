package com.eduspace.backend.space.controller;

import com.eduspace.backend.space.dto.request.SpaceCreateRequestKT;
import com.eduspace.backend.space.dto.request.SpaceUpdateRequestKT;
import com.eduspace.backend.space.dto.response.SpaceResponseKT;
import com.eduspace.backend.space.service.SpaceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/spaces")
@RequiredArgsConstructor
public class AdminSpaceControllerKT {

    private final SpaceService spaceService;

    @GetMapping
    public ResponseEntity<List<SpaceResponseKT>> getAllSpaces() {
        return ResponseEntity.ok(spaceService.getAllSpaces());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SpaceResponseKT> getSpaceById(@PathVariable Long id) {
        return ResponseEntity.ok(spaceService.getSpaceById(id));
    }

    @PostMapping
    public ResponseEntity<SpaceResponseKT> createSpace(@Valid @RequestBody SpaceCreateRequestKT request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(spaceService.createSpace(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SpaceResponseKT> updateSpace(
            @PathVariable Long id,
            @Valid @RequestBody SpaceUpdateRequestKT request
    ) {
        return ResponseEntity.ok(spaceService.updateSpace(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSpace(@PathVariable Long id) {
        spaceService.deleteSpace(id);
        return ResponseEntity.noContent().build();
    }
}
