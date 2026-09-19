package com.eduspace.backend.space.controller;

import com.eduspace.backend.space.dto.request.SpaceImageCreateRequestKT;
import com.eduspace.backend.space.dto.request.SpaceImageReorderRequestKT;
import com.eduspace.backend.space.dto.response.SpaceImageResponseKT;
import com.eduspace.backend.space.service.SpaceImageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminSpaceImageControllerKT {

    private final SpaceImageService spaceImageService;

    /**
     * Thêm ảnh bằng URL vào không gian
     * POST /api/admin/spaces/{spaceId}/images
     */
    @PostMapping("/spaces/{spaceId}/images")
    public ResponseEntity<SpaceImageResponseKT> addImageUrl(
            @PathVariable Long spaceId,
            @Valid @RequestBody SpaceImageCreateRequestKT request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(spaceImageService.addImageUrl(spaceId, request));
    }

    /**
     * Tải lên file ảnh từ máy cục bộ cho không gian
     * POST /api/admin/spaces/{spaceId}/images/upload
     */
    @PostMapping(value = "/spaces/{spaceId}/images/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<SpaceImageResponseKT> uploadImage(
            @PathVariable Long spaceId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "isPrimary", required = false) Boolean isPrimary,
            @RequestParam(value = "sortOrder", required = false) Integer sortOrder
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(spaceImageService.uploadImage(spaceId, file, isPrimary, sortOrder));
    }

    /**
     * Đặt ảnh làm ảnh đại diện chính (primary) của không gian
     * PUT /api/admin/space-images/{imageId}/primary
     */
    @PutMapping("/space-images/{imageId}/primary")
    public ResponseEntity<SpaceImageResponseKT> setPrimaryImage(@PathVariable Long imageId) {
        return ResponseEntity.ok(spaceImageService.setPrimaryImage(imageId));
    }

    /**
     * Sắp xếp lại thứ tự hiển thị của các ảnh trong không gian
     * PUT /api/admin/spaces/{spaceId}/images/order
     */
    @PutMapping("/spaces/{spaceId}/images/order")
    public ResponseEntity<List<SpaceImageResponseKT>> reorderImages(
            @PathVariable Long spaceId,
            @Valid @RequestBody SpaceImageReorderRequestKT request
    ) {
        return ResponseEntity.ok(spaceImageService.reorderImages(spaceId, request));
    }

    /**
     * Xóa ảnh của không gian
     * DELETE /api/admin/space-images/{imageId}
     */
    @DeleteMapping("/space-images/{imageId}")
    public ResponseEntity<Void> deleteImage(@PathVariable Long imageId) {
        spaceImageService.deleteImage(imageId);
        return ResponseEntity.noContent().build();
    }
}
