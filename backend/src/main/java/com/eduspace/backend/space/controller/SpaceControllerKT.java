package com.eduspace.backend.space.controller;

import com.eduspace.backend.space.dto.response.SeatResponseKT;
import com.eduspace.backend.space.dto.response.SpaceImageContentKT;
import com.eduspace.backend.space.dto.response.SpaceImageResponseKT;
import com.eduspace.backend.space.dto.response.SpaceResponseKT;
import com.eduspace.backend.space.dto.response.SpaceTableResponseKT;
import com.eduspace.backend.space.entity.BookingMode;
import com.eduspace.backend.space.entity.SpaceStatus;
import com.eduspace.backend.space.service.SeatService;
import com.eduspace.backend.space.service.SpaceImageService;
import com.eduspace.backend.space.service.SpaceService;
import com.eduspace.backend.space.service.SpaceTableService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/spaces")
@RequiredArgsConstructor
public class SpaceControllerKT {

    private final SpaceService spaceService;
    private final SeatService seatService;
    private final SpaceTableService spaceTableService;
    private final SpaceImageService spaceImageService;

    /**
     * Public/User query danh sách Space kèm bộ lọc metadata
     * GET /api/spaces?spaceTypeId=&status=&building=&minCapacity=&facilityId=&bookingMode=
     */
    @GetMapping
    public ResponseEntity<List<SpaceResponseKT>> getSpaces(
            @RequestParam(required = false) Long spaceTypeId,
            @RequestParam(required = false) SpaceStatus status,
            @RequestParam(required = false) String building,
            @RequestParam(required = false) Integer minCapacity,
            @RequestParam(required = false) Long facilityId,
            @RequestParam(required = false) BookingMode bookingMode
    ) {
        return ResponseEntity.ok(spaceService.getSpacesFiltered(
                spaceTypeId,
                status,
                building,
                minCapacity,
                facilityId,
                bookingMode
        ));
    }

    /**
     * Chi tiết Space
     * GET /api/spaces/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<SpaceResponseKT> getSpaceById(@PathVariable Long id) {
        return ResponseEntity.ok(spaceService.getSpaceById(id));
    }

    /**
     * Danh sách chỗ ngồi của một không gian PER_SEAT
     * GET /api/spaces/{spaceId}/seats
     */
    @GetMapping("/{spaceId}/seats")
    public ResponseEntity<List<SeatResponseKT>> getSeatsBySpace(@PathVariable Long spaceId) {
        return ResponseEntity.ok(seatService.getSeatsBySpace(spaceId));
    }

    /**
     * Danh sách bàn của một không gian PER_TABLE
     * GET /api/spaces/{spaceId}/tables
     */
    @GetMapping("/{spaceId}/tables")
    public ResponseEntity<List<SpaceTableResponseKT>> getTablesBySpace(@PathVariable Long spaceId) {
        return ResponseEntity.ok(spaceTableService.getTablesBySpace(spaceId));
    }

    /**
     * Danh sách hình ảnh của một không gian
     * GET /api/spaces/{spaceId}/images
     */
    @GetMapping("/{spaceId}/images")
    public ResponseEntity<List<SpaceImageResponseKT>> getImagesBySpace(@PathVariable Long spaceId) {
        return ResponseEntity.ok(spaceImageService.getImagesBySpace(spaceId));
    }

    /**
     * Đọc file ảnh được lưu trực tiếp trong bảng space_images.
     * GET /api/spaces/images/{imageId}/content
     */
    @GetMapping("/images/{imageId}/content")
    public ResponseEntity<byte[]> getImageContent(@PathVariable Long imageId) {
        SpaceImageContentKT image = spaceImageService.getImageContent(imageId);
        MediaType mediaType = image.getContentType() != null
                ? MediaType.parseMediaType(image.getContentType())
                : MediaType.APPLICATION_OCTET_STREAM;

        return ResponseEntity.ok()
                .contentType(mediaType)
                .cacheControl(CacheControl.maxAge(1, TimeUnit.HOURS).cachePublic())
                .body(image.getData());
    }
}
