package com.eduspace.backend.booking.entity;

public enum BookingStatus {
    // Nhóm trạng thái chiếm chỗ
    PENDING_APPROVAL,
    CONFIRMED,
    CHECKED_IN,

    // Nhóm trạng thái không chiếm chỗ
    REJECTED,
    CANCELLED,
    EXPIRED,
    NO_SHOW,
    COMPLETED
}
