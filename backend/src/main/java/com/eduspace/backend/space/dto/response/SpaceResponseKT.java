package com.eduspace.backend.space.dto.response;

import com.eduspace.backend.space.entity.Space;
import com.eduspace.backend.space.entity.SpaceStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpaceResponseKT {

    private Long id;
    private String name;
    private String spaceCode;
    private String building;
    private String floor;
    private Integer capacity;
    private SpaceStatus status;
    private String description;
    private SpaceTypeResponseKT spaceType;

    @Builder.Default
    private List<FacilityResponseKT> facilities = new ArrayList<>();

    private String primaryImageUrl;

    @Builder.Default
    private List<SpaceImageResponseKT> images = new ArrayList<>();

    private long activeSeatCount;
    private long activeTableCount;
    private int activeTableCapacity;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static SpaceResponseKT fromEntity(Space space, long activeSeatCount) {
        return fromEntity(space, activeSeatCount, 0, 0, null, new ArrayList<>());
    }

    public static SpaceResponseKT fromEntity(Space space, long activeSeatCount, long activeTableCount, int activeTableCapacity) {
        return fromEntity(space, activeSeatCount, activeTableCount, activeTableCapacity, null, new ArrayList<>());
    }

    public static SpaceResponseKT fromEntity(
            Space space,
            long activeSeatCount,
            long activeTableCount,
            int activeTableCapacity,
            String primaryImageUrl,
            List<SpaceImageResponseKT> images
    ) {
        List<FacilityResponseKT> activeFacilities = new ArrayList<>();
        if (space.getFacilities() != null) {
            activeFacilities = space.getFacilities().stream()
                    .filter(f -> f.getDeletedAt() == null)
                    .map(FacilityResponseKT::fromEntity)
                    .collect(Collectors.toList());
        }

        SpaceTypeResponseKT spaceTypeDto = null;
        if (space.getSpaceType() != null) {
            spaceTypeDto = SpaceTypeResponseKT.fromEntity(space.getSpaceType());
        }

        return SpaceResponseKT.builder()
                .id(space.getId())
                .name(space.getName())
                .spaceCode(space.getSpaceCode())
                .building(space.getBuilding())
                .floor(space.getFloor())
                .capacity(space.getCapacity())
                .status(space.getStatus())
                .description(space.getDescription())
                .spaceType(spaceTypeDto)
                .facilities(activeFacilities)
                .activeSeatCount(activeSeatCount)
                .activeTableCount(activeTableCount)
                .activeTableCapacity(activeTableCapacity)
                .primaryImageUrl(primaryImageUrl)
                .images(images != null ? images : new ArrayList<>())
                .createdAt(space.getCreatedAt())
                .updatedAt(space.getUpdatedAt())
                .build();
    }
}
