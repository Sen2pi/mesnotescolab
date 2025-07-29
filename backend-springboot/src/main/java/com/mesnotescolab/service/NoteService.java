package com.mesnotescolab.service;

import com.mesnotescolab.entity.*;
import com.mesnotescolab.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class NoteService {

    private final NoteRepository noteRepository;
    private final WorkspaceRepository workspaceRepository;
    private final FolderRepository folderRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    public NoteService(NoteRepository noteRepository, WorkspaceRepository workspaceRepository,
                      FolderRepository folderRepository, UserRepository userRepository,
                      NotificationRepository notificationRepository) {
        this.noteRepository = noteRepository;
        this.workspaceRepository = workspaceRepository;
        this.folderRepository = folderRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
    }

    public Page<Note> findAccessibleNotes(User user, int page, int limit, Boolean archived) {
        Pageable pageable = PageRequest.of(page - 1, limit);
        return noteRepository.findAccessibleNotes(user, user.getId(), archived, pageable);
    }

    public List<Note> searchNotes(User user, String search) {
        return noteRepository.searchNotes(user, user.getId(), search);
    }

    public Note createNote(String titre, String contenu, User auteur, Long workspaceId, 
                          Long dossierId, Long parentId, List<String> tags, Boolean isPublic, String couleur) {
        
        Workspace workspace = workspaceRepository.findById(workspaceId)
            .orElseThrow(() -> new RuntimeException("Workspace non trouvé"));

        Note note = new Note(titre, contenu, auteur, workspace);

        if (dossierId != null) {
            Folder dossier = folderRepository.findById(dossierId)
                .orElseThrow(() -> new RuntimeException("Dossier non trouvé"));
            note.setDossier(dossier);
        }

        if (parentId != null) {
            Note parent = noteRepository.findById(parentId)
                .orElseThrow(() -> new RuntimeException("Note parent non trouvée"));
            note.setParent(parent);
        }

        note.setTags(tags);
        note.setIsPublic(isPublic);
        note.setCouleur(couleur);
        
        return noteRepository.save(note);
    }

    public Optional<Note> findById(Long id) {
        return noteRepository.findById(id);
    }

    public Note updateNote(Note note, String titre, String contenu, List<String> tags, 
                          Boolean isPublic, String couleur) {
        
        if (titre != null) note.setTitre(titre);
        if (contenu != null) note.setContenu(contenu);
        if (tags != null) note.setTags(tags);
        if (isPublic != null) note.setIsPublic(isPublic);
        if (couleur != null) note.setCouleur(couleur);

        note.updateActivity();
        note.incrementVersion();

        return noteRepository.save(note);
    }

    public void deleteNote(Long id) {
        notificationRepository.deleteByNoteId(id);
        noteRepository.deleteById(id);
    }

    public Note toggleArchive(Note note) {
        note.setIsArchived(!note.getIsArchived());
        note.updateActivity();
        return noteRepository.save(note);
    }

    public Note addCollaborator(Note note, String email, String permission) {
        User collaborator = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (note.getAuteur().getId().equals(collaborator.getId())) {
            throw new RuntimeException("L'auteur ne peut pas être ajouté comme collaborateur");
        }

        // Remove if already exists to update permission
        note.getCollaborateurs().removeIf(c -> c.getUserId().equals(collaborator.getId()));
        
        Collaborateur collab = new Collaborateur();
        collab.setUserId(collaborator.getId());
        collab.setPermission(permission);
        collab.setDateAjout(LocalDateTime.now());
        
        note.getCollaborateurs().add(collab);
        note.updateActivity();

        return noteRepository.save(note);
    }

    public Note removeCollaborator(Note note, Long userId) {
        note.getCollaborateurs().removeIf(c -> c.getUserId().equals(userId));
        note.updateActivity();
        return noteRepository.save(note);
    }

    public List<Note> findByWorkspace(Long workspaceId, User user) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
            .orElseThrow(() -> new RuntimeException("Workspace non trouvé"));
        return noteRepository.findByWorkspaceAccessible(workspace, user, user.getId());
    }

    public List<Note> findByFolder(Long folderId, User user) {
        return noteRepository.findByFolderAccessible(folderId, user, user.getId());
    }

    public List<Note> findChildren(Long parentId, User user) {
        return noteRepository.findChildrenAccessible(parentId, user, user.getId());
    }

    public List<Note> searchByTitle(String search, User user) {
        return noteRepository.findByTitleContainingIgnoreCase(search, user, user.getId());
    }

    public boolean hasReadAccess(Note note, User user) {
        return note.getAuteur().getId().equals(user.getId()) ||
               note.getCollaborateurs().stream().anyMatch(c -> c.getUserId().equals(user.getId())) ||
               note.getIsPublic();
    }

    public boolean hasWriteAccess(Note note, User user) {
        if (note.getAuteur().getId().equals(user.getId())) {
            return true;
        }
        return note.getCollaborateurs().stream()
                .anyMatch(c -> c.getUserId().equals(user.getId()) && 
                         ("ecriture".equals(c.getPermission()) || "admin".equals(c.getPermission())));
    }

    public boolean hasAdminAccess(Note note, User user) {
        if (note.getAuteur().getId().equals(user.getId())) {
            return true;
        }
        return note.getCollaborateurs().stream()
                .anyMatch(c -> c.getUserId().equals(user.getId()) && "admin".equals(c.getPermission()));
    }

    public List<Note> findReferences(Long noteId, User user) {
        return noteRepository.findReferences(noteId, user.getId());
    }
}