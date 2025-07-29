package com.mesnotescolab.controller;

import com.mesnotescolab.dto.*;
import com.mesnotescolab.entity.Folder;
import com.mesnotescolab.entity.Note;
import com.mesnotescolab.entity.User;
import com.mesnotescolab.entity.Workspace;
import com.mesnotescolab.service.WorkspaceService;
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
@RequestMapping("/api/workspaces")
@Tag(name = "Workspaces", description = "API de gestion des workspaces")
@CrossOrigin(origins = "${cors.allowed-origins}")
public class WorkspaceController {

    private static final Logger logger = LoggerFactory.getLogger(WorkspaceController.class);

    private final WorkspaceService workspaceService;

    public WorkspaceController(WorkspaceService workspaceService) {
        this.workspaceService = workspaceService;
    }

    @GetMapping
    @Operation(summary = "Récupérer tous les workspaces de l'utilisateur")
    public ResponseEntity<ApiResponse<List<Workspace>>> getWorkspaces(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "false") Boolean includePublic) {
        try {
            List<Workspace> workspaces;
            if (search != null && !search.trim().isEmpty()) {
                workspaces = workspaceService.searchWorkspaces(user, search);
            } else {
                workspaces = workspaceService.findByUser(user, includePublic);
            }

            return ResponseEntity.ok(ApiResponse.success("Workspaces récupérés", workspaces));

        } catch (Exception e) {
            logger.error("Erreur récupération workspaces:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Erreur lors de la récupération des workspaces."));
        }
    }

    @GetMapping("/hierarchy")
    @Operation(summary = "Récupérer la hiérarchie des workspaces")
    public ResponseEntity<ApiResponse<List<Workspace>>> getHierarchy(
            @AuthenticationPrincipal User user) {
        try {
            List<Workspace> workspaces = workspaceService.getHierarchy(user);
            return ResponseEntity.ok(ApiResponse.success("Hiérarchie récupérée", workspaces));

        } catch (Exception e) {
            logger.error("Erreur récupération hiérarchie:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Erreur lors de la récupération de la hiérarchie."));
        }
    }

    @PostMapping
    @Operation(summary = "Créer un nouveau workspace")
    public ResponseEntity<ApiResponse<Workspace>> createWorkspace(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CreateWorkspaceRequest request,
            BindingResult bindingResult) {
        try {
            if (bindingResult.hasErrors()) {
                List<String> errors = bindingResult.getFieldErrors().stream()
                        .map(error -> error.getDefaultMessage())
                        .collect(Collectors.toList());
                return ResponseEntity.badRequest().body(ApiResponse.error("Données invalides.", errors));
            }

            Workspace workspace = workspaceService.createWorkspace(
                request.nom(),
                request.description(),
                user,
                request.parent(),
                request.couleur(),
                request.isPublic()
            );

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Workspace créé avec succès !", workspace));

        } catch (RuntimeException e) {
            logger.error("Erreur création workspace: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Erreur création workspace:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Erreur lors de la création du workspace."));
        }
    }

    @GetMapping("/{id}")
    @Operation(summary = "Récupérer un workspace par son ID")
    public ResponseEntity<ApiResponse<Workspace>> getWorkspace(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        try {
            Workspace workspace = workspaceService.findById(id)
                    .orElse(null);

            if (workspace == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Workspace introuvable."));
            }

            if (!workspaceService.hasReadAccess(workspace, user)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Permissions insuffisantes pour cette action."));
            }

            return ResponseEntity.ok(ApiResponse.success("Workspace trouvé", workspace));

        } catch (Exception e) {
            logger.error("Erreur récupération workspace:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Erreur lors de la récupération du workspace."));
        }
    }

    @PutMapping("/{id}")
    @Operation(summary = "Mettre à jour un workspace")
    public ResponseEntity<ApiResponse<Workspace>> updateWorkspace(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @Valid @RequestBody UpdateWorkspaceRequest request,
            BindingResult bindingResult) {
        try {
            if (bindingResult.hasErrors()) {
                List<String> errors = bindingResult.getFieldErrors().stream()
                        .map(error -> error.getDefaultMessage())
                        .collect(Collectors.toList());
                return ResponseEntity.badRequest().body(ApiResponse.error("Données invalides.", errors));
            }

            Workspace workspace = workspaceService.findById(id)
                    .orElse(null);

            if (workspace == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Workspace introuvable."));
            }

            if (!workspaceService.hasWriteAccess(workspace, user)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Permissions insuffisantes pour cette action."));
            }

            Workspace updatedWorkspace = workspaceService.updateWorkspace(
                workspace,
                request.nom(),
                request.description(),
                request.couleur(),
                request.isPublic()
            );

            return ResponseEntity.ok(ApiResponse.success("Workspace mis à jour avec succès !", updatedWorkspace));

        } catch (Exception e) {
            logger.error("Erreur mise à jour workspace:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Erreur lors de la mise à jour du workspace."));
        }
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer un workspace")
    public ResponseEntity<ApiResponse<Void>> deleteWorkspace(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        try {
            Workspace workspace = workspaceService.findById(id)
                    .orElse(null);

            if (workspace == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Workspace introuvable."));
            }

            if (!workspaceService.hasAdminAccess(workspace, user)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Permissions insuffisantes pour cette action."));
            }

            workspaceService.deleteWorkspace(id);

            return ResponseEntity.ok(ApiResponse.success("Workspace supprimé avec succès !"));

        } catch (RuntimeException e) {
            logger.error("Erreur suppression workspace: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Erreur suppression workspace:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Erreur lors de la suppression du workspace."));
        }
    }

    @PostMapping("/{id}/collaborators")
    @Operation(summary = "Ajouter un collaborateur au workspace")
    public ResponseEntity<ApiResponse<Workspace>> addCollaborator(
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

            Workspace workspace = workspaceService.findById(id)
                    .orElse(null);

            if (workspace == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Workspace introuvable."));
            }

            if (!workspaceService.hasAdminAccess(workspace, user)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Permissions insuffisantes pour cette action."));
            }

            Workspace updatedWorkspace = workspaceService.addCollaborator(workspace, request.email(), request.permission());

            return ResponseEntity.ok(ApiResponse.success("Collaborateur ajouté avec succès !", updatedWorkspace));

        } catch (RuntimeException e) {
            logger.error("Erreur ajout collaborateur: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Erreur ajout collaborateur:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Erreur lors de l'ajout du collaborateur."));
        }
    }

    @DeleteMapping("/{id}/collaborators/{userId}")
    @Operation(summary = "Supprimer un collaborateur du workspace")
    public ResponseEntity<ApiResponse<Workspace>> removeCollaborator(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @PathVariable Long userId) {
        try {
            Workspace workspace = workspaceService.findById(id)
                    .orElse(null);

            if (workspace == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Workspace introuvable."));
            }

            if (!workspaceService.hasAdminAccess(workspace, user)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Permissions insuffisantes pour cette action."));
            }

            Workspace updatedWorkspace = workspaceService.removeCollaborator(workspace, userId);

            return ResponseEntity.ok(ApiResponse.success("Collaborateur supprimé avec succès !", updatedWorkspace));

        } catch (Exception e) {
            logger.error("Erreur suppression collaborateur:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Erreur lors de la suppression du collaborateur."));
        }
    }
}