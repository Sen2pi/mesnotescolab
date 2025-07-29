package com.mesnotescolab.controller;

import com.mesnotescolab.dto.*;
import com.mesnotescolab.entity.Folder;
import com.mesnotescolab.entity.Note;
import com.mesnotescolab.entity.User;
import com.mesnotescolab.service.FolderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/folders")
@Tag(name = "Folders", description = "API de gestion des dossiers")
@CrossOrigin(origins = "${cors.allowed-origins}")
public class FolderController {

    private static final Logger logger = LoggerFactory.getLogger(FolderController.class);

    private final FolderService folderService;

    public FolderController(FolderService folderService) {
        this.folderService = folderService;
    }

    @GetMapping("/workspace/{workspaceId}")
    @Operation(summary = "Récupérer tous les dossiers d'un workspace")
    public ResponseEntity<ApiResponse<List<Folder>>> getFolders(
            @AuthenticationPrincipal User user,
            @PathVariable Long workspaceId,
            @RequestParam(required = false) String search) {
        try {
            List<Folder> folders;
            if (search != null && !search.trim().isEmpty()) {
                folders = folderService.searchFolders(workspaceId, user, search);
            } else {
                folders = folderService.findByWorkspace(workspaceId, user);
            }

            return ResponseEntity.ok(ApiResponse.success("Dossiers récupérés", folders));

        } catch (Exception e) {
            logger.error("Erreur récupération dossiers:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Erreur lors de la récupération des dossiers."));
        }
    }

    @GetMapping("/workspace/{workspaceId}/hierarchy")
    @Operation(summary = "Récupérer la hiérarchie des dossiers d'un workspace")
    public ResponseEntity<ApiResponse<List<Folder>>> getHierarchy(
            @AuthenticationPrincipal User user,
            @PathVariable Long workspaceId) {
        try {
            List<Folder> folders = folderService.getHierarchy(workspaceId, user);
            return ResponseEntity.ok(ApiResponse.success("Hiérarchie récupérée", folders));

        } catch (Exception e) {
            logger.error("Erreur récupération hiérarchie dossiers:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Erreur lors de la récupération de la hiérarchie des dossiers."));
        }
    }

    @PostMapping
    @Operation(summary = "Créer un nouveau dossier")
    public ResponseEntity<ApiResponse<Folder>> createFolder(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CreateFolderRequest request,
            BindingResult bindingResult) {
        try {
            if (bindingResult.hasErrors()) {
                List<String> errors = bindingResult.getFieldErrors().stream()
                        .map(error -> error.getDefaultMessage())
                        .collect(Collectors.toList());
                return ResponseEntity.badRequest().body(ApiResponse.error("Données invalides.", errors));
            }

            Folder folder = folderService.createFolder(
                request.nom(),
                request.description(),
                user,
                request.workspace(),
                request.parent(),
                request.couleur(),
                request.isPublic()
            );

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Dossier créé avec succès !", folder));

        } catch (RuntimeException e) {
            logger.error("Erreur création dossier: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Erreur création dossier:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Erreur lors de la création du dossier."));
        }
    }

    @GetMapping("/{id}")
    @Operation(summary = "Récupérer un dossier par son ID")
    public ResponseEntity<ApiResponse<Folder>> getFolder(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        try {
            Folder folder = folderService.findById(id)
                    .orElse(null);

            if (folder == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Dossier introuvable."));
            }

            if (!folderService.hasReadAccess(folder, user)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Permissions insuffisantes pour cette action."));
            }

            return ResponseEntity.ok(ApiResponse.success("Dossier trouvé", folder));

        } catch (Exception e) {
            logger.error("Erreur récupération dossier:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Erreur lors de la récupération du dossier."));
        }
    }

    @PutMapping("/{id}")
    @Operation(summary = "Mettre à jour un dossier")
    public ResponseEntity<ApiResponse<Folder>> updateFolder(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @Valid @RequestBody UpdateFolderRequest request,
            BindingResult bindingResult) {
        try {
            if (bindingResult.hasErrors()) {
                List<String> errors = bindingResult.getFieldErrors().stream()
                        .map(error -> error.getDefaultMessage())
                        .collect(Collectors.toList());
                return ResponseEntity.badRequest().body(ApiResponse.error("Données invalides.", errors));
            }

            Folder folder = folderService.findById(id)
                    .orElse(null);

            if (folder == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Dossier introuvable."));
            }

            if (!folderService.hasWriteAccess(folder, user)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Permissions insuffisantes pour cette action."));
            }

            Folder updatedFolder = folderService.updateFolder(
                folder,
                request.nom(),
                request.description(),
                request.couleur(),
                request.isPublic()
            );

            return ResponseEntity.ok(ApiResponse.success("Dossier mis à jour avec succès !", updatedFolder));

        } catch (Exception e) {
            logger.error("Erreur mise à jour dossier:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Erreur lors de la mise à jour du dossier."));
        }
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer un dossier")
    public ResponseEntity<ApiResponse<Void>> deleteFolder(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        try {
            Folder folder = folderService.findById(id)
                    .orElse(null);

            if (folder == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Dossier introuvable."));
            }

            if (!folderService.hasAdminAccess(folder, user)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Permissions insuffisantes pour cette action."));
            }

            folderService.deleteFolder(id);

            return ResponseEntity.ok(ApiResponse.success("Dossier supprimé avec succès !"));

        } catch (RuntimeException e) {
            logger.error("Erreur suppression dossier: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Erreur suppression dossier:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Erreur lors de la suppression du dossier."));
        }
    }

    @GetMapping("/{id}/notes")
    @Operation(summary = "Récupérer toutes les notes d'un dossier")
    public ResponseEntity<ApiResponse<List<Note>>> getFolderNotes(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestParam(required = false) String search) {
        try {
            Folder folder = folderService.findById(id)
                    .orElse(null);

            if (folder == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Dossier introuvable."));
            }

            if (!folderService.hasReadAccess(folder, user)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Permissions insuffisantes pour cette action."));
            }

            List<Note> notes = folderService.findNotesByFolder(id, user, search);

            return ResponseEntity.ok(ApiResponse.success("Notes du dossier récupérées", notes));

        } catch (Exception e) {
            logger.error("Erreur récupération notes dossier:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Erreur lors de la récupération des notes du dossier."));
        }
    }

    @PostMapping("/{id}/collaborators")
    @Operation(summary = "Ajouter un collaborateur au dossier")
    public ResponseEntity<ApiResponse<Folder>> addCollaborator(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @Valid @RequestBody AddCollaboratorRequest request,
            BindingResult bindingResult) {
        try {
            if (bindingResult.hasErrors()) {
                List<String> errors = bindingResult.getFieldErrors().stream()
                        .map(error -> error.getDefaultMessage())
                        .collect(Collectors.toList());
                return ResponseEntity.badRequest().body(ApiResponse.error("Données invalides.", errors));
            }

            Folder folder = folderService.findById(id)
                    .orElse(null);

            if (folder == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Dossier introuvable."));
            }

            if (!folderService.hasAdminAccess(folder, user)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Permissions insuffisantes pour cette action."));
            }

            Folder updatedFolder = folderService.addCollaborator(folder, request.email(), request.permission());

            return ResponseEntity.ok(ApiResponse.success("Collaborateur ajouté avec succès !", updatedFolder));

        } catch (RuntimeException e) {
            logger.error("Erreur ajout collaborateur dossier: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Erreur ajout collaborateur dossier:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Erreur lors de l'ajout du collaborateur."));
        }
    }

    @DeleteMapping("/{id}/collaborators/{userId}")
    @Operation(summary = "Supprimer un collaborateur du dossier")
    public ResponseEntity<ApiResponse<Folder>> removeCollaborator(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @PathVariable Long userId) {
        try {
            Folder folder = folderService.findById(id)
                    .orElse(null);

            if (folder == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Dossier introuvable."));
            }

            if (!folderService.hasAdminAccess(folder, user)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Permissions insuffisantes pour cette action."));
            }

            Folder updatedFolder = folderService.removeCollaborator(folder, userId);

            return ResponseEntity.ok(ApiResponse.success("Collaborateur supprimé avec succès !", updatedFolder));

        } catch (Exception e) {
            logger.error("Erreur suppression collaborateur dossier:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Erreur lors de la suppression du collaborateur."));
        }
    }
}