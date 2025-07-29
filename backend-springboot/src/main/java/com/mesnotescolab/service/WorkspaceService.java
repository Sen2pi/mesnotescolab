package com.mesnotescolab.service;

import com.mesnotescolab.entity.User;
import com.mesnotescolab.entity.Workspace;
import com.mesnotescolab.repository.FolderRepository;
import com.mesnotescolab.repository.NoteRepository;
import com.mesnotescolab.repository.WorkspaceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class WorkspaceService {

    private static final Logger logger = LoggerFactory.getLogger(WorkspaceService.class);

    @Autowired
    private WorkspaceRepository workspaceRepository;

    @Autowired
    private NoteRepository noteRepository;

    @Autowired
    private FolderRepository folderRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private NotificationService notificationService;

    public List<Workspace> findByUser(User user, boolean includePublic) {
        return workspaceRepository.findByUserAccess(user, user.getId(), includePublic);
    }

    public List<Workspace> searchWorkspaces(User user, String search) {
        return workspaceRepository.searchWorkspaces(user, user.getId(), search);
    }

    public List<Workspace> getHierarchy(User user) {
        return workspaceRepository.findRootWorkspaces(user, user.getId());
    }

    public Optional<Workspace> findById(Long id) {
        return workspaceRepository.findById(id);
    }

    public Workspace createWorkspace(String nom, String description, User proprietaire, 
                                   Long parentId, String couleur, Boolean isPublic) {
        
        Workspace parent = null;
        if (parentId != null) {
            parent = findById(parentId).orElse(null);
            if (parent == null) {
                throw new RuntimeException("Workspace parent introuvable.");
            }
            if (!hasWriteAccess(parent, proprietaire)) {
                throw new RuntimeException("Accès refusé au workspace parent.");
            }
        }

        Workspace workspace = new Workspace();
        workspace.setNom(nom);
        workspace.setDescription(description);
        workspace.setProprietaire(proprietaire);
        workspace.setParent(parent);
        if (couleur != null) workspace.setCouleur(couleur);
        if (isPublic != null) workspace.setIsPublic(isPublic);

        return workspaceRepository.save(workspace);
    }

    public Workspace updateWorkspace(Workspace workspace, String nom, String description, 
                                   String couleur, Boolean isPublic) {
        if (nom != null && !nom.trim().isEmpty()) {
            workspace.setNom(nom.trim());
        }
        if (description != null) {
            workspace.setDescription(description.trim());
        }
        if (couleur != null) {
            workspace.setCouleur(couleur);
        }
        if (isPublic != null) {
            workspace.setIsPublic(isPublic);
        }

        workspace.updateActivity();
        return workspaceRepository.save(workspace);
    }

    public void deleteWorkspace(Long id) {
        // Check if workspace has children
        if (workspaceRepository.existsByParentId(id)) {
            throw new RuntimeException("Impossible de supprimer un workspace qui contient des sous-workspaces.");
        }

        // Check if workspace has notes
        if (noteRepository.existsByWorkspaceId(id)) {
            throw new RuntimeException("Impossible de supprimer un workspace qui contient des notes.");
        }

        // Check if workspace has folders
        if (folderRepository.existsByWorkspaceId(id)) {
            throw new RuntimeException("Impossible de supprimer un workspace qui contient des dossiers.");
        }

        workspaceRepository.deleteById(id);
    }

    public Workspace addCollaborator(Workspace workspace, String email, String permission) {
        User collaborator = userService.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé."));

        if (collaborator.getId().equals(workspace.getProprietaire().getId())) {
            throw new RuntimeException("Le propriétaire ne peut pas être ajouté comme collaborateur.");
        }

        // Check if already collaborator
        boolean alreadyCollaborator = workspace.getCollaborateurs().stream()
                .anyMatch(c -> c.getUserId().equals(collaborator.getId()));
        
        if (alreadyCollaborator) {
            throw new RuntimeException("Cet utilisateur est déjà collaborateur de ce workspace.");
        }

        workspace.addCollaborator(collaborator.getId(), permission);
        
        // Create notification
        try {
            notificationService.createInvitationNotification(
                collaborator, 
                workspace.getProprietaire(), 
                "workspace", 
                workspace.getNom(), 
                permission
            );
        } catch (Exception e) {
            logger.warn("Failed to create notification: {}", e.getMessage());
        }

        return workspaceRepository.save(workspace);
    }

    public Workspace removeCollaborator(Workspace workspace, Long userId) {
        workspace.removeCollaborator(userId);
        return workspaceRepository.save(workspace);
    }

    public boolean hasReadAccess(Workspace workspace, User user) {
        return workspace.hasPermission(user.getId(), "lecture") || workspace.getIsPublic();
    }

    public boolean hasWriteAccess(Workspace workspace, User user) {
        return workspace.hasPermission(user.getId(), "ecriture");
    }

    public boolean hasAdminAccess(Workspace workspace, User user) {
        return workspace.hasPermission(user.getId(), "admin");
    }
}