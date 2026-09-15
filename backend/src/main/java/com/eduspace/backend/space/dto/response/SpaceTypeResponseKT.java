package com.eduspace.backend.space.dto.response;

import com.eduspace.backend.space.entity.BookingMode;
import com.eduspace.backend.space.entity.SpaceType;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpaceTypeResponseKT {
    private Long id;
    private String name;
    private String description;
    private BookingMode bookingMode;
    private boolean requiresApproval;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static SpaceTypeResponseKT fromEntity(SpaceType spaceType) {
        return SpaceTypeResponseKT.builder()
                .id(spaceType.getId())
                .name(spaceType.getName())
                .description(spaceType.getDescription())
                .bookingMode(spaceType.getBookingMode())
                .requiresApproval(spaceType.isRequiresApproval())
                .createdAt(spaceType.getCreatedAt())
                .updatedAt(spaceType.getUpdatedAt())
                .build();
    }
}
