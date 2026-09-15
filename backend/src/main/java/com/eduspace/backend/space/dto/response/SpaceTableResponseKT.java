package com.eduspace.backend.space.dto.response;

import com.eduspace.backend.space.entity.SpaceTable;
import com.eduspace.backend.space.entity.SpaceTableStatus;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpaceTableResponseKT {
    private Long id;
    private Long spaceId;
    private String spaceName;
    private String tableCode;
    private Integer capacity;
    private SpaceTableStatus status;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static SpaceTableResponseKT fromEntity(SpaceTable table) {
        return SpaceTableResponseKT.builder()
                .id(table.getId())
                .spaceId(table.getSpace().getId())
                .spaceName(table.getSpace().getName())
                .tableCode(table.getTableCode())
                .capacity(table.getCapacity())
                .status(table.getStatus())
                .description(table.getDescription())
                .createdAt(table.getCreatedAt())
                .updatedAt(table.getUpdatedAt())
                .build();
    }
}
