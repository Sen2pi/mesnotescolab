package com.mesnotescolab.service;

import com.mesnotescolab.entity.Folder;
import com.mesnotescolab.entity.Note;
import com.mesnotescolab.entity.User;
import com.mesnotescolab.entity.Workspace;
import com.mesnotescolab.repository.FolderRepository;
import com.mesnotescolab.repository.NoteRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class FolderService {

    private static final Logger logger = LoggerFactory.getLogger(FolderService.class);

    @Autowired
    private FolderRepository folderRepository;

    @Autowired
    private NoteRepository noteRepository;

    @Autowired
    private WorkspaceService workspaceService;

    @Autowired
    private UserService userService;

    @Autowired
    private NotificationService notificationService;

    public List<Folder> findByWorkspace(Long workspaceId, User user) {
        Workspace workspace = workspaceService.findById(workspaceId)
                .orElseThrow(() -> new RuntimeException("Workspace introuvable."));
        
        if (!workspaceService.hasReadAccess(workspace, user)) {
            throw new RuntimeException("Accès refusé au workspace.");
        }

        return folderRepository.findByWorkspaceAccessible(workspace, user, user.getId());
    }

    public List<Folder> searchFolders(Long workspaceId, User user, String search) {
        Workspace workspace = workspaceService.findById(workspaceId)
                .orElseThrow(() -> new RuntimeException("Workspace introuvable."));
        
        if (!workspaceService.hasReadAccess(workspace, user)) {
            throw new RuntimeException("Accès refusé au workspace.");
        }

        return folderRepository.searchFolders(workspaceId, user, user.getId(), search);
    }

    public List<Folder> getHierarchy(Long workspaceId, User user) {
        Workspace workspace = workspaceService.findById(workspaceId)
                .orElseThrow(() -> new RuntimeException("Workspace introuvable."));
        
        if (!workspaceService.hasReadAccess(workspace, user)) {
            throw new RuntimeException("Accès refusé au workspace.");
        }

        return folderRepository.findRootFolders(workspaceId, user, user.getId());
    }

    public Optional<Folder> findById(Long id) {
        return folderRepository.findById(id);
    }

    public Folder createFolder(String nom, String description, User proprietaire, 
                              Long workspaceId, Long parentId, String couleur, Boolean isPublic) {
        
        Workspace workspace = workspaceService.findById(workspaceId)
                .orElseThrow(() -> new RuntimeException("Workspace introuvable."));
        
        if (!workspaceService.hasWriteAccess(workspace, proprietaire)) {
            throw new RuntimeException("Accès refusé au workspace.");
        }

        Folder parent = null;
        if (parentId != null) {
            parent = findById(parentId).orElse(null);
            if (parent == null || !parent.getWorkspace().getId().equals(workspaceId)) {
                throw new RuntimeException("Dossier parent invalide.");
            }
        }

        Folder folder = new Folder();
        folder.setNom(nom);
        folder.setDescription(description);
        folder.setWorkspace(workspace);
        folder.setProprietaire(proprietaire);
        folder.setParent(parent);
        if (couleur != null) folder.setCouleur(couleur);
        if (isPublic != null) folder.setIsPublic(isPublic);

        return folderRepository.save(folder);
    }

    public Folder updateFolder(Folder folder, String nom, String description, 
                              String couleur, Boolean isPublic) {
        if (nom != null && !nom.trim().isEmpty()) {
            folder.setNom(nom.trim());
        }
        if (description != null) {
            folder.setDescription(description.trim());
        }
        if (couleur != null) {
            folder.setCouleur(couleur);
        }
        if (isPublic != null) {
            folder.setIsPublic(isPublic);
        }

        folder.updateActivity();
        return folderRepository.save(folder);
    }

    public void deleteFolder(Long id) {
        // Check if folder has children
        if (folderRepository.existsByParentId(id)) {
            throw new RuntimeException("Impossible de supprimer un dossier qui contient des sous-dossiers.");
        }

        // Check if folder has notes
        if (noteRepository.existsByDossierId(id)) {
            throw new RuntimeException("Impossible de supprimer un dossier qui contient des notes.");
        }

        folderRepository.deleteById(id);
    }

    public List<Note> findNotesByFolder(Long folderId, User user, String search) {
        if (search != null && !search.trim().isEmpty()) {
            return noteRepository.searchInFolder(folderId, user.getId(), search);
        } else {
            return noteRepository.findByFolderAccessible(folderId, user.getId());
        }
    }

    public Folder addCollaborator(Folder folder, String email, String permission) {
        User collaborator = userService.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé."));

        if (collaborator.getId().equals(folder.getProprietaire().getId())) {
            throw new RuntimeException("Le propriétaire ne peut pas être ajouté comme collaborateur.");
        }

        // Check if already collaborator
        boolean alreadyCollaborator = folder.getCollaborateurs().stream()
                .anyMatch(c -> c.getUserId().equals(collaborator.getId()));
        
        if (alreadyCollaborator) {
            throw new RuntimeException("Cet utilisateur est déjà collaborateur de ce dossier.");
        }

        folder.addCollaborator(collaborator.getId(), permission);
        
        // Create notification
        try {
            notificationService.createInvitationNotification(
                collaborator, 
                folder.getProprietaire(), 
                "folder", 
                folder.getNom(), 
                permission
            );
        } catch (Exception e) {
            logger.warn("Failed to create notification: {}", e.getMessage());
        }

        return folderRepository.save(folder);
    }

    public Folder removeCollaborator(Folder folder, Long userId) {
        folder.removeCollaborator(userId);
        return folderRepository.save(folder);
    }

    public boolean hasReadAccess(Folder folder, User user) {
        return folder.hasPermission(user.getId(), "lecture") || folder.getIsPublic();
    }

    public boolean hasWriteAccess(Folder folder, User user) {
        return folder.hasPermission(user.getId(), "ecriture");
    }

    public boolean hasAdminAccess(Folder folder, User user) {
        return folder.hasPermission(user.getId(), "admin");
    }
}