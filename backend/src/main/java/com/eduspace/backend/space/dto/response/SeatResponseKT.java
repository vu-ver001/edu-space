package com.eduspace.backend.space.dto.response;

import com.eduspace.backend.space.entity.Seat;
import com.eduspace.backend.space.entity.SeatStatus;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SeatResponseKT {
    private Long id;
    private Long spaceId;
    private String spaceName;
    private String seatCode;
    private SeatStatus status;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static SeatResponseKT fromEntity(Seat seat) {
        return SeatResponseKT.builder()
                .id(seat.getId())
                .spaceId(seat.getSpace().getId())
                .spaceName(seat.getSpace().getName())
                .seatCode(seat.getSeatCode())
                .status(seat.getStatus())
                .description(seat.getDescription())
                .createdAt(seat.getCreatedAt())
                .updatedAt(seat.getUpdatedAt())
                .build();
    }
}
