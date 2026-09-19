package com.eduspace.backend.staff.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffTimelineResponseKT {

    private Long spaceId;

    private String spaceName;

    private String bookingMode;

    private LocalDateTime from;

    private LocalDateTime to;

    private Integer totalEvents;

    private List<StaffTimelineEventResponseKT> events;
}
