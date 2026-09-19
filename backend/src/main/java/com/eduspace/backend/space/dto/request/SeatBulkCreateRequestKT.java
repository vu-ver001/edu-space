package com.eduspace.backend.space.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SeatBulkCreateRequestKT {
    @NotEmpty(message = "Danh sách mã chỗ không được rỗng")
    private List<String> seatCodes;
}
