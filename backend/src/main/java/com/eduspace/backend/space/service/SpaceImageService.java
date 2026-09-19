package com.eduspace.backend.space.service;

import com.eduspace.backend.common.exception.AppException;
import com.eduspace.backend.space.dto.request.SpaceImageCreateRequestKT;
import com.eduspace.backend.space.dto.request.SpaceImageReorderRequestKT;
import com.eduspace.backend.space.dto.response.SpaceImageResponseKT;
import com.eduspace.backend.space.entity.Space;
import com.eduspace.backend.space.entity.SpaceImage;
import com.eduspace.backend.space.repository.SpaceImageRepository;
import com.eduspace.backend.space.repository.SpaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SpaceImageService {

    private static final int MAX_IMAGES_PER_SPACE = 10;
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    private static final List<String> ALLOWED_CONTENT_TYPES = List.of(
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp"
    );
    private static final String UPLOAD_DIR = "uploads/spaces";

    private final SpaceImageRepository spaceImageRepository;
    private final SpaceRepository spaceRepository;

    @Transactional(readOnly = true)
    public List<SpaceImageResponseKT> getImagesBySpace(Long spaceId) {
        findSpaceOrThrow(spaceId);
        return spaceImageRepository.findBySpaceIdOrderBySortOrderAscIdAsc(spaceId)
                .stream()
                .map(SpaceImageResponseKT::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public SpaceImageResponseKT addImageUrl(Long spaceId, SpaceImageCreateRequestKT request) {
        Space space = findSpaceOrThrow(spaceId);

        if (spaceImageRepository.countBySpaceId(spaceId) >= MAX_IMAGES_PER_SPACE) {
            throw new AppException(
                    HttpStatus.CONFLICT,
                    "SPACE_IMAGE_LIMIT_REACHED",
                    "Không gian đã đạt giới hạn tối đa " + MAX_IMAGES_PER_SPACE + " ảnh"
            );
        }

        if (request.getImageUrl() == null || request.getImageUrl().trim().isEmpty()) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "VALIDATION_ERROR",
                    "URL hình ảnh không được để trống"
            );
        }

        boolean shouldBePrimary = resolvePrimaryFlagOnAdd(spaceId, request.getIsPrimary());

        SpaceImage image = SpaceImage.builder()
                .space(space)
                .imageUrl(request.getImageUrl().trim())
                .isPrimary(shouldBePrimary)
                .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0)
                .build();

        SpaceImage saved = spaceImageRepository.save(image);
        return SpaceImageResponseKT.fromEntity(saved);
    }

    @Transactional
    public SpaceImageResponseKT uploadImage(Long spaceId, MultipartFile file, Boolean isPrimary, Integer sortOrder) {
        Space space = findSpaceOrThrow(spaceId);

        if (spaceImageRepository.countBySpaceId(spaceId) >= MAX_IMAGES_PER_SPACE) {
            throw new AppException(
                    HttpStatus.CONFLICT,
                    "SPACE_IMAGE_LIMIT_REACHED",
                    "Không gian đã đạt giới hạn tối đa " + MAX_IMAGES_PER_SPACE + " ảnh"
            );
        }

        if (file == null || file.isEmpty()) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "VALIDATION_ERROR",
                    "Tập tin hình ảnh không được để trống"
            );
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "IMAGE_TOO_LARGE",
                    "Dung lượng ảnh vượt quá giới hạn tối đa 5MB"
            );
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "INVALID_IMAGE_TYPE",
                    "Định dạng file không hợp lệ. Chỉ chấp nhận JPG, PNG, WEBP"
            );
        }

        String storedPath = saveFileLocally(file, contentType);
        boolean shouldBePrimary = resolvePrimaryFlagOnAdd(spaceId, isPrimary);

        SpaceImage image = SpaceImage.builder()
                .space(space)
                .imageUrl(storedPath)
                .isPrimary(shouldBePrimary)
                .sortOrder(sortOrder != null ? sortOrder : 0)
                .build();

        SpaceImage saved = spaceImageRepository.save(image);
        return SpaceImageResponseKT.fromEntity(saved);
    }

    @Transactional
    public SpaceImageResponseKT setPrimaryImage(Long imageId) {
        SpaceImage targetImage = findImageOrThrow(imageId);
        Long spaceId = targetImage.getSpace().getId();

        Optional<SpaceImage> currentPrimaryOpt = spaceImageRepository.findBySpaceIdAndIsPrimaryTrue(spaceId);
        if (currentPrimaryOpt.isPresent()) {
            SpaceImage currentPrimary = currentPrimaryOpt.get();
            if (!currentPrimary.getId().equals(imageId)) {
                currentPrimary.setPrimary(false);
                spaceImageRepository.save(currentPrimary);
            }
        }

        targetImage.setPrimary(true);
        SpaceImage saved = spaceImageRepository.save(targetImage);
        return SpaceImageResponseKT.fromEntity(saved);
    }

    @Transactional
    public void deleteImage(Long imageId) {
        SpaceImage image = findImageOrThrow(imageId);
        Long spaceId = image.getSpace().getId();
        boolean wasPrimary = image.isPrimary();

        spaceImageRepository.delete(image);
        spaceImageRepository.flush();

        if (wasPrimary) {
            List<SpaceImage> remainingImages = spaceImageRepository.findBySpaceIdOrderBySortOrderAscIdAsc(spaceId);
            if (!remainingImages.isEmpty()) {
                SpaceImage nextPrimary = remainingImages.get(0);
                nextPrimary.setPrimary(true);
                spaceImageRepository.save(nextPrimary);
            }
        }
    }

    @Transactional
    public List<SpaceImageResponseKT> reorderImages(Long spaceId, SpaceImageReorderRequestKT request) {
        findSpaceOrThrow(spaceId);

        if (request.getItems() != null) {
            for (SpaceImageReorderRequestKT.ImageOrderItemKT item : request.getItems()) {
                SpaceImage img = findImageOrThrow(item.getImageId());
                if (!img.getSpace().getId().equals(spaceId)) {
                    throw new AppException(
                            HttpStatus.BAD_REQUEST,
                            "VALIDATION_ERROR",
                            "Ảnh với id " + item.getImageId() + " không thuộc không gian id " + spaceId
                    );
                }
                img.setSortOrder(item.getSortOrder());
                spaceImageRepository.save(img);
            }
        }

        return getImagesBySpace(spaceId);
    }

    private boolean resolvePrimaryFlagOnAdd(Long spaceId, Boolean requestedPrimary) {
        Optional<SpaceImage> existingPrimaryOpt = spaceImageRepository.findBySpaceIdAndIsPrimaryTrue(spaceId);

        if (Boolean.TRUE.equals(requestedPrimary)) {
            existingPrimaryOpt.ifPresent(oldPrimary -> {
                oldPrimary.setPrimary(false);
                spaceImageRepository.save(oldPrimary);
            });
            return true;
        }

        return existingPrimaryOpt.isEmpty();
    }

    private Space findSpaceOrThrow(Long spaceId) {
        return spaceRepository.findByIdAndDeletedAtIsNull(spaceId)
                .orElseThrow(() -> new AppException(
                        HttpStatus.NOT_FOUND,
                        "SPACE_NOT_FOUND",
                        "Không tìm thấy không gian với id: " + spaceId
                ));
    }

    private SpaceImage findImageOrThrow(Long imageId) {
        return spaceImageRepository.findById(imageId)
                .orElseThrow(() -> new AppException(
                        HttpStatus.NOT_FOUND,
                        "SPACE_IMAGE_NOT_FOUND",
                        "Không tìm thấy ảnh với id: " + imageId
                ));
    }

    private String saveFileLocally(MultipartFile file, String contentType) {
        try {
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String extension = resolveFileExtension(file.getOriginalFilename(), contentType);
            String fileName = UUID.randomUUID() + extension;
            Path targetLocation = uploadPath.resolve(fileName);

            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return "/uploads/spaces/" + fileName;
        } catch (IOException e) {
            log.error("Lỗi khi lưu file upload ảnh: {}", e.getMessage(), e);
            throw new AppException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "FILE_STORAGE_ERROR",
                    "Không thể lưu trữ file ảnh lên hệ thống"
            );
        }
    }

    private String resolveFileExtension(String originalFilename, String contentType) {
        if (originalFilename != null && originalFilename.contains(".")) {
            return originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        if ("image/png".equalsIgnoreCase(contentType)) {
            return ".png";
        }
        if ("image/webp".equalsIgnoreCase(contentType)) {
            return ".webp";
        }
        return ".jpg";
    }
}
