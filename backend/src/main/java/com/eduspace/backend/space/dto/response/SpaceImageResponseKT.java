package com.eduspace.backend.space.dto.response;

import com.eduspace.backend.space.entity.SpaceImage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpaceImageResponseKT {

    private Long id;
    private Long spaceId;
    private String imageUrl;
    private boolean isPrimary;
    private int sortOrder;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static SpaceImageResponseKT fromEntity(SpaceImage entity) {
        if (entity == null) {
            return null;
        }
        return SpaceImageResponseKT.builder()
                .id(entity.getId())
                .spaceId(entity.getSpace() != null ? entity.getSpace().getId() : null)
                .imageUrl(entity.getImageUrl())
                .isPrimary(entity.isPrimary())
                .sortOrder(entity.getSortOrder())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
