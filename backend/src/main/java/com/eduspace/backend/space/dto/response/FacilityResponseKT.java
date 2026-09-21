package com.eduspace.backend.space.dto.response;

import com.eduspace.backend.space.entity.Facility;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FacilityResponseKT {
    private Long id;
    private String name;
    private String description;
    private long spaceCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static FacilityResponseKT fromEntity(Facility facility) {
        return fromEntity(facility, 0L);
    }

    public static FacilityResponseKT fromEntity(Facility facility, long spaceCount) {
        return FacilityResponseKT.builder()
                .id(facility.getId())
                .name(facility.getName())
                .description(facility.getDescription())
                .spaceCount(spaceCount)
                .createdAt(facility.getCreatedAt())
                .updatedAt(facility.getUpdatedAt())
                .build();
    }
}
