package com.eduspace.backend.reporting.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceResourceDetailResponse {

    // Loại tài nguyên: "Phòng học", "Bàn nhóm", "Ghế ngồi"
    private String resourceType;

    // Mã tài nguyên: ví dụ "G-103", "S10", "T-01"
    private String resourceCode;

    // Tên hiển thị tài nguyên: ví dụ "Phòng G-103", "Ghế S10"
    private String resourceName;

    // Thuộc không gian / phòng nào
    private String spaceCode;
    private String spaceName;

    // Vị trí (Tòa nhà, Tầng)
    private String location;

    // Lý do / Mô tả tình trạng bảo trì
    private String reason;

    // Thời gian bảo trì nếu là khoảng khóa lịch (maintenance_block)
    private LocalDateTime startTime;
    private LocalDateTime endTime;

    // Trạng thái hiển thị (ví dụ "Đang bảo trì", "Tạm ngừng phục vụ")
    private String statusText;
}
