package com.eduspace.backend.booking.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpaceResponse {
    private Long id;
    private String name;
    private String spaceTypeName;
    private boolean requiresApproval;
    private String building;
    private String floor;
    private Integer capacity;
    private String status;
    private String imageUrl;
    private String description;
    private List<String> facilities;
    private String bookingMode;
    private Boolean allowSeatSelection;
    private Boolean allowTableSelection;
}
