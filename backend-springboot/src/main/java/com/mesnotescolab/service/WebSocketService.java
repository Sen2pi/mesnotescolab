package com.mesnotescolab.service;

import com.mesnotescolab.entity.Note;
import com.mesnotescolab.entity.Notification;
import com.mesnotescolab.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class WebSocketService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void sendNotificationToUser(Long userId, Notification notification) {
        messagingTemplate.convertAndSendToUser(
            userId.toString(), 
            "/queue/notifications", 
            notification
        );
    }

    public void sendNoteUpdate(Note note, String action, User user) {
        Map<String, Object> message = Map.of(
            "type", "note_update",
            "action", action,
            "note", note,
            "user", Map.of(
                "id", user.getId(),
                "nom", user.getNom()
            ),
            "timestamp", System.currentTimeMillis()
        );

        // Send to note collaborators
        note.getCollaborateurs().forEach(collaborator -> {
            if (!collaborator.getUserId().equals(user.getId())) {
                messagingTemplate.convertAndSendToUser(
                    collaborator.getUserId().toString(),
                    "/queue/note-updates",
                    message
                );
            }
        });

        // Send to note author if not the same as user
        if (!note.getAuteur().getId().equals(user.getId())) {
            messagingTemplate.convertAndSendToUser(
                note.getAuteur().getId().toString(),
                "/queue/note-updates",
                message
            );
        }
    }

    public void sendWorkspaceUpdate(Long workspaceId, String action, User user) {
        Map<String, Object> message = Map.of(
            "type", "workspace_update",
            "action", action,
            "workspaceId", workspaceId,
            "user", Map.of(
                "id", user.getId(),
                "nom", user.getNom()
            ),
            "timestamp", System.currentTimeMillis()
        );

        messagingTemplate.convertAndSend("/topic/workspace/" + workspaceId, message);
    }

    public void sendFolderUpdate(Long folderId, String action, User user) {
        Map<String, Object> message = Map.of(
            "type", "folder_update",
            "action", action,
            "folderId", folderId,
            "user", Map.of(
                "id", user.getId(),
                "nom", user.getNom()
            ),
            "timestamp", System.currentTimeMillis()
        );

        messagingTemplate.convertAndSend("/topic/folder/" + folderId, message);
    }
}