package com.eduspace.backend.notification.repository;

import com.eduspace.backend.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // Lấy toàn bộ thông báo của một người dùng, sắp xếp mới nhất lên đầu
    List<Notification> findByRecipientIdOrderByCreatedAtDesc(Long recipientId);

    // Đếm số lượng thông báo chưa đọc (dùng cho badge hiển thị trên icon chuông)
    long countByRecipientIdAndIsReadFalse(Long recipientId);
}