package com.eduspace.backend.booking.entity;



/**
 * Trạng thái của một booking theo tài liệu logic 02_Yeu_cau_logic §1.2 & §2.
 * - Chiếm chỗ: PENDING_APPROVAL, CONFIRMED, CHECKED_IN
 * - Không chiếm chỗ: REJECTED, CANCELLED, EXPIRED, NO_SHOW, COMPLETED
 */
public enum BookingStatus {
    PENDING_APPROVAL("Chờ duyệt", true),
    CONFIRMED("Đã xác nhận", true),
    CHECKED_IN("Đã check-in", true),
    REJECTED("Bị từ chối", false),
    CANCELLED("Đã hủy", false),
    EXPIRED("Hết hạn duyệt", false),
    NO_SHOW("Vắng mặt", false),
    COMPLETED("Hoàn thành", false);

    private final String displayName;
    private final boolean occupying;

    BookingStatus(String displayName, boolean occupying) {
        this.displayName = displayName;
        this.occupying = occupying;
    }

    public String getDisplayName() {
        return displayName;
    }

    public boolean isOccupying() {
        return occupying;
    }
}
