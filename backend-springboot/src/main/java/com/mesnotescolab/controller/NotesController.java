package com.mesnotescolab.controller;

import com.mesnotescolab.dto.*;
import com.mesnotescolab.entity.Note;
import com.mesnotescolab.entity.User;
import com.mesnotescolab.service.NoteService;
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
@RequestMapping("/api/notes")
@Tag(name = "Notes", description = "API de gestion des notes")
@CrossOrigin(origins = "${cors.allowed-origins}")
public class NotesController {

    private static final Logger logger = LoggerFactory.getLogger(NotesController.class);

    private final NoteService noteService;

    public NotesController(NoteService noteService) {
        this.noteService = noteService;
    }

    @GetMapping
    @Operation(summary = "Récupérer toutes les notes de l'utilisateur")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getNotes(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String tags,
            @RequestParam(defaultValue = "false") Boolean archived) {
        try {
            
            List<Note> notes;
            if (search != null && !search.trim().isEmpty()) {
                notes = noteService.searchNotes(user, search);
            } else {
                Page<Note> notePage = noteService.findAccessibleNotes(user, page, limit, archived);
                notes = notePage.getContent();
                
                Map<String, Object> pagination = new HashMap<>();
                pagination.put("currentPage", page);
                pagination.put("totalPages", notePage.getTotalPages());
                pagination.put("totalNotes", notePage.getTotalElements());
                pagination.put("hasNextPage", notePage.hasNext());
                pagination.put("hasPrevPage", notePage.hasPrevious());

                Map<String, Object> response = new HashMap<>();
                response.put("notes", notes);
                response.put("pagination", pagination);

                return ResponseEntity.ok(ApiResponse.success("Notes récupérées", response));
            }

            Map<String, Object> response = new HashMap<>();
            response.put("notes", notes);

            return ResponseEntity.ok(ApiResponse.success("Notes récupérées", response));

        } catch (Exception e) {
            logger.error("Erreur récupération notes:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Erreur lors de la récupération des notes."));
        }
    }

    @PostMapping
    @Operation(summary = "Créer une nouvelle note")
    public ResponseEntity<ApiResponse<Note>> createNote(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CreateNoteRequest request,
            BindingResult bindingResult) {
        try {
            if (bindingResult.hasErrors()) {
                List<String> errors = bindingResult.getFieldErrors().stream()
                        .map(error -> error.getDefaultMessage())
                        .collect(Collectors.toList());
                return ResponseEntity.badRequest().body(ApiResponse.error("Données invalides.", errors));
            }

            Note note = noteService.createNote(
                request.titre(),
                request.contenu(),
                user,
                request.workspace(),
                request.dossier(),
                request.parent(),
                request.tags(),
                request.isPublic(),
                request.couleur()
            );

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Note créée avec succès !", note));

        } catch (RuntimeException e) {
            logger.error("Erreur création note: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Erreur création note:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Erreur lors de la création de la note."));
        }
    }

    @GetMapping("/{id}")
    @Operation(summary = "Récupérer une note par son ID")
    public ResponseEntity<ApiResponse<Note>> getNote(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        try {
            Note note = noteService.findById(id)
                    .orElse(null);

            if (note == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Note introuvable."));
            }

            if (!noteService.hasReadAccess(note, user)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Permissions insuffisantes pour cette action."));
            }

            return ResponseEntity.ok(ApiResponse.success("Note trouvée", note));

        } catch (Exception e) {
            logger.error("Erreur récupération note:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Erreur lors de la récupération de la note."));
        }
    }

    @PutMapping("/{id}")
    @Operation(summary = "Mettre à jour une note")
    public ResponseEntity<ApiResponse<Note>> updateNote(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @Valid @RequestBody UpdateNoteRequest request,
            BindingResult bindingResult) {
        try {
            if (bindingResult.hasErrors()) {
                List<String> errors = bindingResult.getFieldErrors().stream()
                        .map(error -> error.getDefaultMessage())
                        .collect(Collectors.toList());
                return ResponseEntity.badRequest().body(ApiResponse.error("Données invalides.", errors));
            }

            Note note = noteService.findById(id)
                    .orElse(null);

            if (note == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Note introuvable."));
            }

            if (!noteService.hasWriteAccess(note, user)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Permissions insuffisantes pour cette action."));
            }

            Note updatedNote = noteService.updateNote(
                note,
                request.titre(),
                request.contenu(),
                request.tags(),
                request.isPublic(),
                request.couleur()
            );

            return ResponseEntity.ok(ApiResponse.success("Note mise à jour avec succès !", updatedNote));

        } catch (Exception e) {
            logger.error("Erreur mise à jour note:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Erreur lors de la mise à jour de la note."));
        }
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer une note")
    public ResponseEntity<ApiResponse<Void>> deleteNote(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        try {
            Note note = noteService.findById(id)
                    .orElse(null);

            if (note == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Note introuvable."));
            }

            if (!noteService.hasAdminAccess(note, user)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Permissions insuffisantes pour cette action."));
            }

            noteService.deleteNote(id);

            return ResponseEntity.ok(ApiResponse.success("Note supprimée avec succès !"));

        } catch (Exception e) {
            logger.error("Erreur suppression note:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Erreur lors de la suppression de la note."));
        }
    }

    @PostMapping("/{id}/collaborators")
    @Operation(summary = "Ajouter un collaborateur à une note")
    public ResponseEntity<ApiResponse<Note>> addCollaborator(
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

            Note note = noteService.findById(id)
                    .orElse(null);

            if (note == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Note introuvable."));
            }

            if (!noteService.hasAdminAccess(note, user)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Permissions insuffisantes pour cette action."));
            }

            Note updatedNote = noteService.addCollaborator(note, request.email(), request.permission());

            return ResponseEntity.ok(ApiResponse.success("Collaborateur ajouté avec succès !", updatedNote));

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
    @Operation(summary = "Retirer un collaborateur d'une note")
    public ResponseEntity<ApiResponse<Note>> removeCollaborator(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @PathVariable Long userId) {
        try {
            Note note = noteService.findById(id)
                    .orElse(null);

            if (note == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Note introuvable."));
            }

            if (!noteService.hasAdminAccess(note, user)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Permissions insuffisantes pour cette action."));
            }

            Note updatedNote = noteService.removeCollaborator(note, userId);

            return ResponseEntity.ok(ApiResponse.success("Collaborateur retiré avec succès !", updatedNote));

        } catch (Exception e) {
            logger.error("Erreur suppression collaborateur:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Erreur lors de la suppression du collaborateur."));
        }
    }

    @PatchMapping("/{id}/archive")
    @Operation(summary = "Archiver/désarchiver une note")
    public ResponseEntity<ApiResponse<Note>> toggleArchive(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        try {
            Note note = noteService.findById(id)
                    .orElse(null);

            if (note == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Note introuvable."));
            }

            if (!noteService.hasAdminAccess(note, user)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Permissions insuffisantes pour cette action."));
            }

            Note updatedNote = noteService.toggleArchive(note);
            String message = updatedNote.getIsArchived() ? "Note archivée avec succès !" : "Note désarchivée avec succès !";

            return ResponseEntity.ok(ApiResponse.success(message, updatedNote));

        } catch (Exception e) {
            logger.error("Erreur archivage note:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Erreur lors de l'archivage de la note."));
        }
    }

    @GetMapping("/workspace/{workspaceId}")
    @Operation(summary = "Récupérer toutes les notes d'un workspace")
    public ResponseEntity<ApiResponse<List<Note>>> getNotesByWorkspace(
            @AuthenticationPrincipal User user,
            @PathVariable Long workspaceId,
            @RequestParam(required = false) String search) {
        try {
            List<Note> notes = noteService.findByWorkspace(workspaceId, user);

            return ResponseEntity.ok(ApiResponse.success("Notes du workspace récupérées", notes));

        } catch (Exception e) {
            logger.error("Erreur récupération notes workspace:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Erreur lors de la récupération des notes."));
        }
    }

    @GetMapping("/{id}/children")
    @Operation(summary = "Récupérer les notes enfants d'une note")
    public ResponseEntity<ApiResponse<List<Note>>> getChildren(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        try {
            Note note = noteService.findById(id)
                    .orElse(null);

            if (note == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Note introuvable."));
            }

            if (!noteService.hasReadAccess(note, user)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Permissions insuffisantes pour cette action."));
            }

            List<Note> children = noteService.findChildren(id, user);

            return ResponseEntity.ok(ApiResponse.success("Notes enfants récupérées", children));

        } catch (Exception e) {
            logger.error("Erreur récupération notes enfants:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Erreur lors de la récupération des notes enfants."));
        }
    }

    @GetMapping("/search")
    @Operation(summary = "Rechercher des notes par titre")
    public ResponseEntity<ApiResponse<List<Note>>> searchNotes(
            @AuthenticationPrincipal User user,
            @RequestParam String q,
            @RequestParam(required = false) Long workspace) {
        try {
            if (q == null || q.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Terme de recherche requis."));
            }

            List<Note> notes = noteService.searchByTitle(q, user);

            return ResponseEntity.ok(ApiResponse.success("Recherche effectuée", notes));

        } catch (Exception e) {
            logger.error("Erreur recherche notes:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Erreur lors de la recherche."));
        }
    }

    @GetMapping("/{id}/references")
    @Operation(summary = "Récupérer les notes qui référencent cette note")
    public ResponseEntity<ApiResponse<List<Note>>> getReferences(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        try {
            Note note = noteService.findById(id)
                    .orElse(null);

            if (note == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Note introuvable."));
            }

            if (!noteService.hasReadAccess(note, user)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Permissions insuffisantes pour cette action."));
            }

            List<Note> references = noteService.findReferences(id, user);

            return ResponseEntity.ok(ApiResponse.success("Références récupérées", references));

        } catch (Exception e) {
            logger.error("Erreur récupération références:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Erreur lors de la récupération des références."));
        }
    }

    @GetMapping("/{id}/permissions")
    @Operation(summary = "Vérifier les permissions d'une note (debug)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPermissions(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        try {
            Note note = noteService.findById(id)
                    .orElse(null);

            if (note == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Note introuvable."));
            }

            Map<String, Object> permissions = new HashMap<>();
            permissions.put("canRead", noteService.hasReadAccess(note, user));
            permissions.put("canWrite", noteService.hasWriteAccess(note, user));
            permissions.put("canDelete", noteService.hasAdminAccess(note, user));
            permissions.put("canArchive", noteService.hasAdminAccess(note, user));
            permissions.put("isAuthor", note.getAuteur().getId().equals(user.getId()));
            permissions.put("isPublic", note.getIsPublic());

            Map<String, Object> response = new HashMap<>();
            response.put("note", Map.of(
                "id", note.getId(),
                "titre", note.getTitre(),
                "auteur", note.getAuteur(),
                "isPublic", note.getIsPublic()
            ));
            response.put("user", Map.of(
                "id", user.getId(),
                "nom", user.getNom()
            ));
            response.put("permissions", permissions);

            return ResponseEntity.ok(ApiResponse.success("Permissions vérifiées", response));

        } catch (Exception e) {
            logger.error("Erro ao verificar permissões:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Erro ao verificar permissões."));
        }
    }

    @GetMapping("/debug/workspaces/{noteId}")
    @Operation(summary = "Debug workspace information for a note")
    public ResponseEntity<ApiResponse<Map<String, Object>>> debugWorkspaces(
            @AuthenticationPrincipal User user,
            @PathVariable Long noteId) {
        try {
            Note note = noteService.findById(noteId)
                    .orElse(null);

            if (note == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Note introuvable."));
            }

            Map<String, Object> noteInfo = new HashMap<>();
            noteInfo.put("id", note.getId());
            noteInfo.put("titre", note.getTitre());
            noteInfo.put("workspace", note.getWorkspace());

            Map<String, Object> parentInfo = null;
            if (note.getParent() != null) {
                parentInfo = new HashMap<>();
                parentInfo.put("id", note.getParent().getId());
                parentInfo.put("titre", note.getParent().getTitre());
                parentInfo.put("workspace", note.getParent().getWorkspace());
            }

            Map<String, Object> response = new HashMap<>();
            response.put("note", noteInfo);
            response.put("parent", parentInfo);

            return ResponseEntity.ok(ApiResponse.success("Debug info", response));

        } catch (Exception e) {
            logger.error("Erro debug workspaces:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Erreur lors du debug."));
        }
    }
}