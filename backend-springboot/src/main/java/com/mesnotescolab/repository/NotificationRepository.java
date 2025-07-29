package com.mesnotescolab.repository;

import com.mesnotescolab.entity.Notification;
import com.mesnotescolab.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findByDestinataire(User destinataire, Pageable pageable);
    
    Page<Notification> findByDestinataireAndIsLue(User destinataire, Boolean isLue, Pageable pageable);
    
    long countByDestinataireAndIsLue(User destinataire, Boolean isLue);

    @Modifying
    @Query("UPDATE Notification n SET n.isLue = true WHERE n.destinataire = :user AND n.id IN :ids")
    int markAsReadByIds(@Param("user") User user, @Param("ids") List<Long> ids);

    @Modifying
    @Query("UPDATE Notification n SET n.isLue = true WHERE n.destinataire = :user AND n.isLue = false")
    int markAllAsRead(@Param("user") User user);

    void deleteByNoteId(Long noteId);
}