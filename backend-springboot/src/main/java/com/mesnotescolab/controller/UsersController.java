package com.mesnotescolab.controller;

import com.mesnotescolab.dto.*;
import com.mesnotescolab.entity.Notification;
import com.mesnotescolab.entity.User;
import com.mesnotescolab.repository.NoteRepository;
import com.mesnotescolab.service.NotificationService;
import com.mesnotescolab.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@Tag(name = "Users", description = "API de gestion des utilisateurs")
@CrossOrigin(origins = "${cors.allowed-origins}")
public class UsersController {

    private static final Logger logger = LoggerFactory.getLogger(UsersController.class);

    @Autowired
    private UserService userService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private NoteRepository noteRepository;

    @GetMapping("/search")
    @Operation(summary = "Rechercher des utilisateurs par email ou nom")
    public ResponseEntity<ApiResponse<List<User>>> searchUsers(
            @AuthenticationPrincipal User currentUser,
            @RequestParam String q,
            @RequestParam(defaultValue = "10") int limit) {
        try {
            if (q == null || q.trim().length() < 2) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Le terme de recherche doit contenir au moins 2 caractères."));
            }

            List<User> users = userService.searchUsers(q, currentUser, limit);

            return ResponseEntity.ok(ApiResponse.success("Utilisateurs trouvés", users));

        } catch (Exception e) {
            logger.error("Erreur recherche utilisateurs:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Erreur lors de la recherche d'utilisateurs."));
        }
    }

    @GetMapping("/notifications")
    @Operation(summary = "Récupérer les notifications de l'utilisateur")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getNotifications(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(defaultValue = "false") Boolean unreadOnly) {
        try {
            Page<Notification> notificationPage = notificationService.getNotifications(user, page, limit, unreadOnly);
            long unreadCount = notificationService.getUnreadCount(user);

            Map<String, Object> pagination = new HashMap<>();
            pagination.put("currentPage", page);
            pagination.put("totalPages", notificationPage.getTotalPages());
            pagination.put("total", notificationPage.getTotalElements());
            pagination.put("unreadCount", unreadCount);

            Map<String, Object> response = new HashMap<>();
            response.put("notifications", notificationPage.getContent());
            response.put("pagination", pagination);

            return ResponseEntity.ok(ApiResponse.success("Notifications récupérées", response));

        } catch (Exception e) {
            logger.error("Erreur récupération notifications:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Erreur lors de la récupération des notifications."));
        }
    }

    @PatchMapping("/notifications/mark-read")
    @Operation(summary = "Marquer des notifications comme lues")
    public ResponseEntity<ApiResponse<Map<String, Object>>> markNotificationsAsRead(
            @AuthenticationPrincipal User user,
            @RequestBody MarkNotificationsRequest request) {
        try {
            int modifiedCount;

            if (request.getMarkAll() != null && request.getMarkAll()) {
                modifiedCount = notificationService.markAllAsRead(user);
            } else if (request.getNotificationIds() != null && !request.getNotificationIds().isEmpty()) {
                modifiedCount = notificationService.markAsRead(user, request.getNotificationIds());
            } else {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("IDs de notifications ou paramètre markAll requis."));
            }

            Map<String, Object> response = new HashMap<>();
            response.put("modifiedCount", modifiedCount);

            return ResponseEntity.ok(ApiResponse.success("Notifications marquées comme lues.", response));

        } catch (Exception e) {
            logger.error("Erreur marquage notifications:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Erreur lors du marquage des notifications."));
        }
    }

    @GetMapping("/notifications/unread-count")
    @Operation(summary = "Obtenir le nombre de notifications non lues")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUnreadCount(
            @AuthenticationPrincipal User user) {
        try {
            long count = notificationService.getUnreadCount(user);

            Map<String, Object> response = new HashMap<>();
            response.put("count", count);

            return ResponseEntity.ok(ApiResponse.success("Comptage effectué", response));

        } catch (Exception e) {
            logger.error("Erreur comptage notifications:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Erreur lors du comptage des notifications."));
        }
    }

    @GetMapping("/stats")
    @Operation(summary = "Obtenir les statistiques de l'utilisateur")
    public ResponseEntity<ApiResponse<UserStatsResponse>> getUserStats(
            @AuthenticationPrincipal User user) {
        try {
            long notesCreated = noteRepository.countByAuteurAndIsArchived(user, false);
            long notesCollaborated = noteRepository.countByCollaboratorAndIsArchived(user.getId(), false);
            long archivedNotes = noteRepository.countByAuteurAndIsArchived(user, true) + 
                               noteRepository.countByCollaboratorAndIsArchived(user.getId(), true);
            long publicNotes = noteRepository.countByAuteurAndIsPublic(user);
            long totalNotes = notesCreated + notesCollaborated;

            UserStatsResponse stats = new UserStatsResponse(
                totalNotes, notesCreated, notesCollaborated, archivedNotes, publicNotes
            );

            return ResponseEntity.ok(ApiResponse.success("Statistiques récupérées", stats));

        } catch (Exception e) {
            logger.error("Erreur statistiques utilisateur:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Erreur lors de la récupération des statistiques."));
        }
    }

    @GetMapping("/profile/{userId}")
    @Operation(summary = "Obtenir le profil public d'un utilisateur")
    public ResponseEntity<ApiResponse<User>> getUserProfile(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long userId) {
        try {
            User user = userService.findById(userId)
                    .orElse(null);

            if (user == null || !user.getIsActive()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Utilisateur non trouvé."));
            }

            // Ne pas montrer l'email si ce n'est pas l'utilisateur connecté
            if (!userId.equals(currentUser.getId())) {
                user.setEmail(null);
            }

            return ResponseEntity.ok(ApiResponse.success("Profil récupéré", user));

        } catch (Exception e) {
            logger.error("Erreur récupération profil:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Erreur lors de la récupération du profil."));
        }
    }

    @PutMapping("/language")
    @Operation(summary = "Atualizar idioma do usuário")
    public ResponseEntity<ApiResponse<User>> updateLanguage(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody UpdateLanguageRequest request,
            BindingResult bindingResult) {
        try {
            if (bindingResult.hasErrors()) {
                List<String> errors = bindingResult.getFieldErrors().stream()
                        .map(error -> error.getDefaultMessage())
                        .collect(Collectors.toList());
                return ResponseEntity.badRequest().body(ApiResponse.error("Dados inválidos.", errors));
            }

            User updatedUser = userService.updateLanguage(currentUser, request.getIdioma());

            return ResponseEntity.ok(ApiResponse.success("Idioma atualizado com sucesso", updatedUser));

        } catch (Exception e) {
            logger.error("Erro ao atualizar idioma:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Erro interno do servidor"));
        }
    }
}