package com.mesnotescolab.service;

import com.mesnotescolab.entity.Notification;
import com.mesnotescolab.entity.User;
import com.mesnotescolab.repository.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("NotificationService Tests")
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private NotificationService notificationService;

    private User testUser;
    private Notification testNotification;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setNom("Test User");
        testUser.setEmail("test@example.com");

        testNotification = new Notification();
        testNotification.setId(1L);
        testNotification.setDestinataire(testUser);
        testNotification.setType(Notification.TypeNotification.SYSTEME);
        testNotification.setMessage("Test Message");
        testNotification.setIsLue(false);
        testNotification.setCreatedAt(LocalDateTime.now());
    }

    @Test
    @DisplayName("Should get all notifications with pagination")
    void shouldGetAllNotificationsWithPagination() {
        // Given
        int page = 1;
        int limit = 10;
        Boolean unreadOnly = null;
        
        List<Notification> notifications = Arrays.asList(testNotification);
        Page<Notification> notificationPage = new PageImpl<>(notifications, PageRequest.of(0, limit), 1);
        
        when(notificationRepository.findByDestinataire(eq(testUser), any(Pageable.class)))
                .thenReturn(notificationPage);

        // When
        Page<Notification> result = notificationService.getNotifications(testUser, page, limit, unreadOnly);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0)).isEqualTo(testNotification);
        
        verify(notificationRepository).findByDestinataire(eq(testUser), any(Pageable.class));
        verify(notificationRepository, never()).findByDestinataireAndIsLue(any(), any(), any());
    }

    @Test
    @DisplayName("Should get only unread notifications when unreadOnly is true")
    void shouldGetOnlyUnreadNotificationsWhenUnreadOnlyIsTrue() {
        // Given
        int page = 1;
        int limit = 10;
        Boolean unreadOnly = true;
        
        List<Notification> notifications = Arrays.asList(testNotification);
        Page<Notification> notificationPage = new PageImpl<>(notifications, PageRequest.of(0, limit), 1);
        
        when(notificationRepository.findByDestinataireAndIsLue(eq(testUser), eq(false), any(Pageable.class)))
                .thenReturn(notificationPage);

        // When
        Page<Notification> result = notificationService.getNotifications(testUser, page, limit, unreadOnly);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0)).isEqualTo(testNotification);
        
        verify(notificationRepository).findByDestinataireAndIsLue(eq(testUser), eq(false), any(Pageable.class));
        verify(notificationRepository, never()).findByDestinataire(any(), any());
    }

    @Test
    @DisplayName("Should count unread notifications")
    void shouldCountUnreadNotifications() {
        // Given
        long expectedCount = 5L;
        when(notificationRepository.countByDestinataireAndIsLue(testUser, false))
                .thenReturn(expectedCount);

        // When
        long result = notificationService.countUnreadNotifications(testUser);

        // Then
        assertThat(result).isEqualTo(expectedCount);
        verify(notificationRepository).countByDestinataireAndIsLue(testUser, false);
    }

    @Test
    @DisplayName("Should create notification successfully")
    void shouldCreateNotificationSuccessfully() {
        // Given
        String titre = "New Notification";
        String message = "New Message";
        String type = "INFO";
        Long relatedEntityId = 1L;
        
        when(notificationRepository.save(any(Notification.class))).thenReturn(testNotification);

        // When
        Notification result = notificationService.createNotification(testUser, titre, message, type, relatedEntityId);

        // Then
        assertThat(result).isNotNull();
        assertThat(result).isEqualTo(testNotification);
        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    @DisplayName("Should create system notification successfully")
    void shouldCreateSystemNotificationSuccessfully() {
        // Given
        String titre = "System Notification";
        String message = "System Message";
        String type = "SYSTEM";
        
        when(notificationRepository.save(any(Notification.class))).thenReturn(testNotification);

        // When
        Notification result = notificationService.createSystemNotification(testUser, titre, message, type);

        // Then
        assertThat(result).isNotNull();
        assertThat(result).isEqualTo(testNotification);
        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    @DisplayName("Should mark notifications as read successfully")
    void shouldMarkNotificationsAsReadSuccessfully() {
        // Given
        List<Long> notificationIds = Arrays.asList(1L, 2L, 3L);
        int expectedModifiedCount = 3;
        
        when(notificationRepository.markAsReadByIdsAndUser(notificationIds, testUser))
                .thenReturn(expectedModifiedCount);

        // When
        int result = notificationService.markAsRead(testUser, notificationIds);

        // Then
        assertThat(result).isEqualTo(expectedModifiedCount);
        verify(notificationRepository).markAsReadByIdsAndUser(notificationIds, testUser);
    }

    @Test
    @DisplayName("Should mark all notifications as read successfully")
    void shouldMarkAllNotificationsAsReadSuccessfully() {
        // Given
        int expectedModifiedCount = 10;
        
        when(notificationRepository.markAllAsReadByUser(testUser))
                .thenReturn(expectedModifiedCount);

        // When
        int result = notificationService.markAllAsRead(testUser);

        // Then
        assertThat(result).isEqualTo(expectedModifiedCount);
        verify(notificationRepository).markAllAsReadByUser(testUser);
    }

    @Test
    @DisplayName("Should delete notification successfully")
    void shouldDeleteNotificationSuccessfully() {
        // Given
        Long notificationId = 1L;

        // When
        notificationService.deleteNotification(notificationId);

        // Then
        verify(notificationRepository).deleteById(notificationId);
    }

    @Test
    @DisplayName("Should delete notifications by note id successfully")
    void shouldDeleteNotificationsByNoteIdSuccessfully() {
        // Given
        Long noteId = 1L;

        // When
        notificationService.deleteByNoteId(noteId);

        // Then
        verify(notificationRepository).deleteByNoteId(noteId);
    }

    @Test
    @DisplayName("Should delete old notifications successfully")
    void shouldDeleteOldNotificationsSuccessfully() {
        // Given
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(30);
        int expectedDeletedCount = 5;
        
        when(notificationRepository.deleteByCreatedAtBefore(any(LocalDateTime.class)))
                .thenReturn(expectedDeletedCount);

        // When
        int result = notificationService.deleteOldNotifications(cutoffDate);

        // Then
        assertThat(result).isEqualTo(expectedDeletedCount);
        verify(notificationRepository).deleteByCreatedAtBefore(any(LocalDateTime.class));
    }

    @Test
    @DisplayName("Should find notifications by type")
    void shouldFindNotificationsByType() {
        // Given
        String type = "INFO";
        List<Notification> notifications = Arrays.asList(testNotification);
        
        when(notificationRepository.findByDestinataireAndType(testUser, type))
                .thenReturn(notifications);

        // When
        List<Notification> result = notificationService.findByType(testUser, type);

        // Then
        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        assertThat(result.get(0)).isEqualTo(testNotification);
        
        verify(notificationRepository).findByDestinataireAndType(testUser, type);
    }

    @Test
    @DisplayName("Should find notifications by related entity")
    void shouldFindNotificationsByRelatedEntity() {
        // Given
        Long relatedEntityId = 1L;
        List<Notification> notifications = Arrays.asList(testNotification);
        
        when(notificationRepository.findByDestinataireAndRelatedEntityId(testUser, relatedEntityId))
                .thenReturn(notifications);

        // When
        List<Notification> result = notificationService.findByRelatedEntity(testUser, relatedEntityId);

        // Then
        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        assertThat(result.get(0)).isEqualTo(testNotification);
        
        verify(notificationRepository).findByDestinataireAndRelatedEntityId(testUser, relatedEntityId);
    }

    @Test
    @DisplayName("Should get recent notifications")
    void shouldGetRecentNotifications() {
        // Given
        int limit = 5;
        List<Notification> notifications = Arrays.asList(testNotification);
        
        when(notificationRepository.findRecentByUser(eq(testUser), any(Pageable.class)))
                .thenReturn(notifications);

        // When
        List<Notification> result = notificationService.getRecentNotifications(testUser, limit);

        // Then
        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        assertThat(result.get(0)).isEqualTo(testNotification);
        
        verify(notificationRepository).findRecentByUser(eq(testUser), any(Pageable.class));
    }
}