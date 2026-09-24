package com.eduspace.backend.space.controller;

import com.eduspace.backend.space.dto.request.SpaceImageCreateRequestKT;
import com.eduspace.backend.space.dto.request.SpaceImageReorderRequestKT;
import com.eduspace.backend.space.dto.response.SpaceImageResponseKT;
import com.eduspace.backend.space.dto.response.SpaceActionResponseKT;
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
    public ResponseEntity<SpaceActionResponseKT<SpaceImageResponseKT>> addImageUrl(
            @PathVariable Long spaceId,
            @Valid @RequestBody SpaceImageCreateRequestKT request
    ) {
        SpaceImageResponseKT created = spaceImageService.addImageUrl(spaceId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(SpaceActionResponseKT.of("Đã thêm ảnh không gian thành công.", created));
    }

    /**
     * Tải lên file ảnh từ máy cục bộ cho không gian
     * POST /api/admin/spaces/{spaceId}/images/upload
     */
    @PostMapping(value = "/spaces/{spaceId}/images/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<SpaceActionResponseKT<SpaceImageResponseKT>> uploadImage(
            @PathVariable Long spaceId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "isPrimary", required = false) Boolean isPrimary,
            @RequestParam(value = "sortOrder", required = false) Integer sortOrder
    ) {
        SpaceImageResponseKT created = spaceImageService.uploadImage(spaceId, file, isPrimary, sortOrder);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(SpaceActionResponseKT.of("Đã tải ảnh không gian lên thành công.", created));
    }

    /**
     * Đặt ảnh làm ảnh đại diện chính (primary) của không gian
     * PUT /api/admin/space-images/{imageId}/primary
     */
    @PutMapping("/space-images/{imageId}/primary")
    public ResponseEntity<SpaceActionResponseKT<SpaceImageResponseKT>> setPrimaryImage(@PathVariable Long imageId) {
        SpaceImageResponseKT updated = spaceImageService.setPrimaryImage(imageId);
        return ResponseEntity.ok(SpaceActionResponseKT.of("Đã đặt ảnh đại diện thành công.", updated));
    }

    /**
     * Sắp xếp lại thứ tự hiển thị của các ảnh trong không gian
     * PUT /api/admin/spaces/{spaceId}/images/order
     */
    @PutMapping("/spaces/{spaceId}/images/order")
    public ResponseEntity<SpaceActionResponseKT<List<SpaceImageResponseKT>>> reorderImages(
            @PathVariable Long spaceId,
            @Valid @RequestBody SpaceImageReorderRequestKT request
    ) {
        List<SpaceImageResponseKT> updated = spaceImageService.reorderImages(spaceId, request);
        return ResponseEntity.ok(SpaceActionResponseKT.of("Đã sắp xếp ảnh thành công.", updated));
    }

    /**
     * Xóa ảnh của không gian
     * DELETE /api/admin/space-images/{imageId}
     */
    @DeleteMapping("/space-images/{imageId}")
    public ResponseEntity<SpaceActionResponseKT<Void>> deleteImage(@PathVariable Long imageId) {
        spaceImageService.deleteImage(imageId);
        return ResponseEntity.ok(SpaceActionResponseKT.message("Đã xóa ảnh không gian thành công."));
    }
}
