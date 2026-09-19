package com.eduspace.backend.booking.entity;



public enum AuditAction {
    CREATE_BOOKING("Tạo yêu cầu đặt chỗ"),
    APPROVE_BOOKING("Duyệt yêu cầu đặt chỗ"),
    REJECT_BOOKING("Từ chối yêu cầu đặt chỗ"),
    CANCEL_BOOKING("Hủy đặt chỗ"),
    CHECK_IN("Xác nhận có mặt (Check-in)"),
    EXPIRE_TIMEOUT("Hệ thống tự hủy do quá giờ duyệt"),
    NO_SHOW_TIMEOUT("Hệ thống tự đánh dấu vắng mặt"),
    COMPLETE_TIMEOUT("Hệ thống tự hoàn thành lượt đặt");

    private final String description;

    AuditAction(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
