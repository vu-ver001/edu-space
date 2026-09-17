package com.eduspace.backend.booking.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AvailabilityResponse {
    private Long spaceId;
    private String spaceName;
    private boolean available;
    @Builder.Default
    private List<ConflictDetail> conflicts = new ArrayList<>();
}
