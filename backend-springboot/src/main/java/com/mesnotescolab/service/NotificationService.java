package com.mesnotescolab.service;

import com.mesnotescolab.entity.Notification;
import com.mesnotescolab.entity.User;
import com.mesnotescolab.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    public Page<Notification> getNotifications(User user, int page, int limit, Boolean unreadOnly) {
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
        
        if (unreadOnly != null && unreadOnly) {
            return notificationRepository.findByDestinataireAndIsLue(user, false, pageable);
        } else {
            return notificationRepository.findByDestinataire(user, pageable);
        }
    }

    public long getUnreadCount(User user) {
        return notificationRepository.countByDestinataireAndIsLue(user, false);
    }

    public int markAsRead(User user, List<Long> notificationIds) {
        return notificationRepository.markAsReadByIds(user, notificationIds);
    }

    public int markAllAsRead(User user) {
        return notificationRepository.markAllAsRead(user);
    }
}