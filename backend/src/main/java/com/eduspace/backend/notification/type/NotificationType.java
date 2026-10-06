package com.eduspace.backend.notification.type;

public enum NotificationType {
    BOOKING_CONFIRMED,     // đặt thành công
    PENDING_APPROVAL,      // chờ duyệt (gửi cho Staff)
    APPROVED, REJECTED,    // kết quả duyệt (gửi cho Sinh viên)
    CANCELLED,             // bị hủy
    REMINDER,              // nhắc nhở sắp đến giờ
    SYSTEM                 // thông báo chung
}