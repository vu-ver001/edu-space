package com.eduspace.backend.staff.entity;

/**
 * Các hành động vận hành của Staff cần lưu vết kiểm toán (Audit).
 */
public enum StaffAuditAction {
    BOOKING_APPROVED("Duyệt đặt chỗ"),
    BOOKING_REJECTED("Từ chối đặt chỗ"),
    MAINTENANCE_CREATED("Tạo khoảng bảo trì không gian"),
    MAINTENANCE_UPDATED("Cập nhật khoảng bảo trì"),
    MAINTENANCE_CANCELLED("Hủy / Xóa mềm khoảng bảo trì"),
    STAFF_CHECKED_IN_BOOKING("Nhân viên hỗ trợ check-in cho sinh viên");

    private final String description;

    StaffAuditAction(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
