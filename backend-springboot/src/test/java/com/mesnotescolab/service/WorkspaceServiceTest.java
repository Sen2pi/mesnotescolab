package com.mesnotescolab.service;

import com.mesnotescolab.entity.*;
import com.mesnotescolab.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("WorkspaceService Tests")
class WorkspaceServiceTest {

    @Mock
    private WorkspaceRepository workspaceRepository;
    
    @Mock
    private NoteRepository noteRepository;
    
    @Mock
    private FolderRepository folderRepository;
    
    @Mock
    private UserService userService;
    
    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private WorkspaceService workspaceService;

    private User testUser;
    private Workspace testWorkspace;
    private Workspace parentWorkspace;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setNom("Test User");
        testUser.setEmail("test@example.com");

        parentWorkspace = new Workspace();
        parentWorkspace.setId(1L);
        parentWorkspace.setNom("Parent Workspace");
        parentWorkspace.setProprietaire(testUser);

        testWorkspace = new Workspace();
        testWorkspace.setId(2L);
        testWorkspace.setNom("Test Workspace");
        testWorkspace.setProprietaire(testUser);
        testWorkspace.setParent(parentWorkspace);
        testWorkspace.setCreatedAt(LocalDateTime.now());
        testWorkspace.setUpdatedAt(LocalDateTime.now());
    }

    @Test
    @DisplayName("Should find workspaces by user successfully")
    void shouldFindWorkspacesByUserSuccessfully() {
        // Given
        boolean includePublic = false;
        List<Workspace> workspaces = Arrays.asList(testWorkspace);
        
        when(workspaceRepository.findByUserAccess(testUser, testUser.getId(), includePublic))
                .thenReturn(workspaces);

        // When
        List<Workspace> result = workspaceService.findByUser(testUser, includePublic);

        // Then
        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        assertThat(result.get(0)).isEqualTo(testWorkspace);
        
        verify(workspaceRepository).findByUserAccess(testUser, testUser.getId(), includePublic);
    }

    @Test
    @DisplayName("Should search workspaces successfully")
    void shouldSearchWorkspacesSuccessfully() {
        // Given
        String search = "test";
        List<Workspace> workspaces = Arrays.asList(testWorkspace);
        
        when(workspaceRepository.searchWorkspaces(testUser, testUser.getId(), search))
                .thenReturn(workspaces);

        // When
        List<Workspace> result = workspaceService.searchWorkspaces(testUser, search);

        // Then
        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        assertThat(result.get(0)).isEqualTo(testWorkspace);
        
        verify(workspaceRepository).searchWorkspaces(testUser, testUser.getId(), search);
    }

    @Test
    @DisplayName("Should get hierarchy successfully")
    void shouldGetHierarchySuccessfully() {
        // Given
        List<Workspace> workspaces = Arrays.asList(parentWorkspace);
        
        when(workspaceRepository.findRootWorkspaces(testUser, testUser.getId()))
                .thenReturn(workspaces);

        // When
        List<Workspace> result = workspaceService.getHierarchy(testUser);

        // Then
        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        assertThat(result.get(0)).isEqualTo(parentWorkspace);
        
        verify(workspaceRepository).findRootWorkspaces(testUser, testUser.getId());
    }

    @Test
    @DisplayName("Should find workspace by id successfully")
    void shouldFindWorkspaceByIdSuccessfully() {
        // Given
        Long workspaceId = 1L;
        when(workspaceRepository.findById(workspaceId)).thenReturn(Optional.of(testWorkspace));

        // When
        Optional<Workspace> result = workspaceService.findById(workspaceId);

        // Then
        assertThat(result).isPresent();
        assertThat(result.get()).isEqualTo(testWorkspace);
        
        verify(workspaceRepository).findById(workspaceId);
    }

    @Test
    @DisplayName("Should create workspace successfully")
    void shouldCreateWorkspaceSuccessfully() {
        // Given
        String nom = "New Workspace";
        String description = "New Description";
        Long parentId = 1L;
        String couleur = "#ff0000";
        Boolean isPublic = false;

        when(workspaceRepository.findById(parentId)).thenReturn(Optional.of(parentWorkspace));
        when(workspaceRepository.save(any(Workspace.class))).thenReturn(testWorkspace);

        // When
        Workspace result = workspaceService.createWorkspace(nom, description, testUser, 
                                                           parentId, couleur, isPublic);

        // Then
        assertThat(result).isNotNull();
        assertThat(result).isEqualTo(testWorkspace);
        
        verify(workspaceRepository).findById(parentId);
        verify(workspaceRepository).save(any(Workspace.class));
    }

    @Test
    @DisplayName("Should create workspace without parent successfully")
    void shouldCreateWorkspaceWithoutParentSuccessfully() {
        // Given
        String nom = "New Workspace";
        String description = "New Description";
        Long parentId = null;
        String couleur = "#ff0000";
        Boolean isPublic = false;

        when(workspaceRepository.save(any(Workspace.class))).thenReturn(testWorkspace);

        // When
        Workspace result = workspaceService.createWorkspace(nom, description, testUser, 
                                                           parentId, couleur, isPublic);

        // Then
        assertThat(result).isNotNull();
        assertThat(result).isEqualTo(testWorkspace);
        
        verify(workspaceRepository, never()).findById(any());
        verify(workspaceRepository).save(any(Workspace.class));
    }

    @Test
    @DisplayName("Should throw exception when parent workspace not found")
    void shouldThrowExceptionWhenParentWorkspaceNotFound() {
        // Given
        String nom = "New Workspace";
        String description = "New Description";
        Long parentId = 999L;
        
        when(workspaceRepository.findById(parentId)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> workspaceService.createWorkspace(nom, description, testUser, 
                                                                 parentId, null, false))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Workspace parent non trouvé");
        
        verify(workspaceRepository).findById(parentId);
        verify(workspaceRepository, never()).save(any(Workspace.class));
    }

    @Test
    @DisplayName("Should update workspace successfully")
    void shouldUpdateWorkspaceSuccessfully() {
        // Given
        String newNom = "Updated Workspace";
        String newDescription = "Updated Description";
        String newCouleur = "#00ff00";
        Boolean newIsPublic = true;

        when(workspaceRepository.save(any(Workspace.class))).thenReturn(testWorkspace);

        // When
        Workspace result = workspaceService.updateWorkspace(testWorkspace, newNom, newDescription, 
                                                           newCouleur, newIsPublic);

        // Then
        assertThat(result).isNotNull();
        verify(workspaceRepository).save(testWorkspace);
    }

    @Test
    @DisplayName("Should delete workspace successfully")
    void shouldDeleteWorkspaceSuccessfully() {
        // Given
        Long workspaceId = 1L;
        when(noteRepository.existsByWorkspaceId(workspaceId)).thenReturn(false);
        when(folderRepository.existsByWorkspaceId(workspaceId)).thenReturn(false);

        // When
        workspaceService.deleteWorkspace(workspaceId);

        // Then
        verify(noteRepository).existsByWorkspaceId(workspaceId);
        verify(folderRepository).existsByWorkspaceId(workspaceId);
        verify(workspaceRepository).deleteById(workspaceId);
    }

    @Test
    @DisplayName("Should throw exception when deleting workspace with notes")
    void shouldThrowExceptionWhenDeletingWorkspaceWithNotes() {
        // Given
        Long workspaceId = 1L;
        when(noteRepository.existsByWorkspaceId(workspaceId)).thenReturn(true);

        // When & Then
        assertThatThrownBy(() -> workspaceService.deleteWorkspace(workspaceId))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Impossible de supprimer un workspace contenant des notes ou dossiers.");
        
        verify(noteRepository).existsByWorkspaceId(workspaceId);
        verify(workspaceRepository, never()).deleteById(any());
    }

    @Test
    @DisplayName("Should throw exception when deleting workspace with folders")
    void shouldThrowExceptionWhenDeletingWorkspaceWithFolders() {
        // Given
        Long workspaceId = 1L;
        when(noteRepository.existsByWorkspaceId(workspaceId)).thenReturn(false);
        when(folderRepository.existsByWorkspaceId(workspaceId)).thenReturn(true);

        // When & Then
        assertThatThrownBy(() -> workspaceService.deleteWorkspace(workspaceId))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Impossible de supprimer un workspace contenant des notes ou dossiers.");
        
        verify(noteRepository).existsByWorkspaceId(workspaceId);
        verify(folderRepository).existsByWorkspaceId(workspaceId);
        verify(workspaceRepository, never()).deleteById(any());
    }

    @Test
    @DisplayName("Should add collaborator successfully")
    void shouldAddCollaboratorSuccessfully() {
        // Given
        String email = "collaborator@example.com";
        String permission = "lecture";
        
        User collaborator = new User();
        collaborator.setId(2L);
        collaborator.setEmail(email);
        
        testWorkspace.setCollaborateurs(new ArrayList<>());
        
        when(userService.findByEmail(email)).thenReturn(Optional.of(collaborator));
        when(workspaceRepository.save(any(Workspace.class))).thenReturn(testWorkspace);

        // When
        Workspace result = workspaceService.addCollaborator(testWorkspace, email, permission);

        // Then
        assertThat(result).isNotNull();
        verify(userService).findByEmail(email);
        verify(workspaceRepository).save(testWorkspace);
    }

    @Test
    @DisplayName("Should throw exception when adding owner as collaborator")
    void shouldThrowExceptionWhenAddingOwnerAsCollaborator() {
        // Given
        String ownerEmail = testUser.getEmail();
        String permission = "lecture";
        
        when(userService.findByEmail(ownerEmail)).thenReturn(Optional.of(testUser));

        // When & Then
        assertThatThrownBy(() -> workspaceService.addCollaborator(testWorkspace, ownerEmail, permission))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Le propriétaire ne peut pas être ajouté comme collaborateur");
        
        verify(userService).findByEmail(ownerEmail);
        verify(workspaceRepository, never()).save(any(Workspace.class));
    }

    @Test
    @DisplayName("Should remove collaborator successfully")
    void shouldRemoveCollaboratorSuccessfully() {
        // Given
        Long userId = 2L;
        Collaborateur collaborateur = new Collaborateur();
        collaborateur.setUserId(userId);
        
        testWorkspace.setCollaborateurs(new ArrayList<>(Arrays.asList(collaborateur)));
        when(workspaceRepository.save(any(Workspace.class))).thenReturn(testWorkspace);

        // When
        Workspace result = workspaceService.removeCollaborator(testWorkspace, userId);

        // Then
        assertThat(result).isNotNull();
        verify(workspaceRepository).save(testWorkspace);
    }

    @Test
    @DisplayName("Should check read access for owner")
    void shouldCheckReadAccessForOwner() {
        // When
        boolean hasAccess = workspaceService.hasReadAccess(testWorkspace, testUser);

        // Then
        assertThat(hasAccess).isTrue();
    }

    @Test
    @DisplayName("Should check read access for public workspace")
    void shouldCheckReadAccessForPublicWorkspace() {
        // Given
        testWorkspace.setIsPublic(true);
        User otherUser = new User();
        otherUser.setId(2L);

        // When
        boolean hasAccess = workspaceService.hasReadAccess(testWorkspace, otherUser);

        // Then
        assertThat(hasAccess).isTrue();
    }

    @Test
    @DisplayName("Should check write access for owner")
    void shouldCheckWriteAccessForOwner() {
        // When
        boolean hasAccess = workspaceService.hasWriteAccess(testWorkspace, testUser);

        // Then
        assertThat(hasAccess).isTrue();
    }

    @Test
    @DisplayName("Should check admin access for owner")
    void shouldCheckAdminAccessForOwner() {
        // When
        boolean hasAccess = workspaceService.hasAdminAccess(testWorkspace, testUser);

        // Then
        assertThat(hasAccess).isTrue();
    }

    @Test
    @DisplayName("Should deny read access for non-collaborator on private workspace")
    void shouldDenyReadAccessForNonCollaboratorOnPrivateWorkspace() {
        // Given
        testWorkspace.setIsPublic(false);
        testWorkspace.setCollaborateurs(new ArrayList<>());
        User otherUser = new User();
        otherUser.setId(2L);

        // When
        boolean hasAccess = workspaceService.hasReadAccess(testWorkspace, otherUser);

        // Then
        assertThat(hasAccess).isFalse();
    }

    @Test
    @DisplayName("Should allow read access for collaborator")
    void shouldAllowReadAccessForCollaborator() {
        // Given
        User collaboratorUser = new User();
        collaboratorUser.setId(2L);
        
        Collaborateur collaborateur = new Collaborateur();
        collaborateur.setUserId(collaboratorUser.getId());
        collaborateur.setPermission("lecture");
        
        testWorkspace.setCollaborateurs(Arrays.asList(collaborateur));

        // When
        boolean hasAccess = workspaceService.hasReadAccess(testWorkspace, collaboratorUser);

        // Then
        assertThat(hasAccess).isTrue();
    }

    @Test
    @DisplayName("Should allow write access for collaborator with write permission")
    void shouldAllowWriteAccessForCollaboratorWithWritePermission() {
        // Given
        User collaboratorUser = new User();
        collaboratorUser.setId(2L);
        
        Collaborateur collaborateur = new Collaborateur();
        collaborateur.setUserId(collaboratorUser.getId());
        collaborateur.setPermission("ecriture");
        
        testWorkspace.setCollaborateurs(Arrays.asList(collaborateur));

        // When
        boolean hasAccess = workspaceService.hasWriteAccess(testWorkspace, collaboratorUser);

        // Then
        assertThat(hasAccess).isTrue();
    }

    @Test
    @DisplayName("Should deny write access for collaborator with read-only permission")
    void shouldDenyWriteAccessForCollaboratorWithReadOnlyPermission() {
        // Given
        User collaboratorUser = new User();
        collaboratorUser.setId(2L);
        
        Collaborateur collaborateur = new Collaborateur();
        collaborateur.setUserId(collaboratorUser.getId());
        collaborateur.setPermission("lecture");
        
        testWorkspace.setCollaborateurs(Arrays.asList(collaborateur));

        // When
        boolean hasAccess = workspaceService.hasWriteAccess(testWorkspace, collaboratorUser);

        // Then
        assertThat(hasAccess).isFalse();
    }
}