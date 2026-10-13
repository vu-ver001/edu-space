package com.eduspace.backend.notification.service;

import com.eduspace.backend.notification.entity.Notification;
import com.eduspace.backend.notification.type.NotificationType;
import com.eduspace.backend.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    /**
     * Gửi thông báo đến một người dùng cụ thể
     */
    @Transactional
    public void sendNotification(Long recipientId, NotificationType type, String title, String message, Long relatedBookingId) {
        Notification notification = Notification.builder()
                .recipientId(recipientId)
                .type(type)
                .title(title)
                .message(message)
                .relatedBookingId(relatedBookingId)
                .isRead(false)
                .build();
        notificationRepository.save(notification);
    }

    /**
     * Lấy danh sách thông báo của người dùng
     */
    @Transactional(readOnly = true)
    public List<Notification> getMyNotifications(Long recipientId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(recipientId);
    }

    /**
     * Lấy số lượng thông báo chưa đọc
     */
    @Transactional(readOnly = true)
    public long getUnreadCount(Long recipientId) {
        return notificationRepository.countByRecipientIdAndIsReadFalse(recipientId);
    }

    /**
     * Đánh dấu một thông báo là đã đọc
     */
    @Transactional
    public void markAsRead(Long notificationId, Long recipientId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông báo"));

        if (!notification.getRecipientId().equals(recipientId)) {
            throw new RuntimeException("Bạn không có quyền thao tác trên thông báo này");
        }

        notification.setRead(true);
        notificationRepository.save(notification);
    }
}