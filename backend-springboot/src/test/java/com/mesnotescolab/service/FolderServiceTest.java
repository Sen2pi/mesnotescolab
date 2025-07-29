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
@DisplayName("FolderService Tests")
class FolderServiceTest {

    @Mock
    private FolderRepository folderRepository;
    
    @Mock
    private NoteRepository noteRepository;
    
    @Mock
    private WorkspaceService workspaceService;
    
    @Mock
    private UserService userService;
    
    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private FolderService folderService;

    private User testUser;
    private Workspace testWorkspace;
    private Folder testFolder;
    private Note testNote;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setNom("Test User");
        testUser.setEmail("test@example.com");

        testWorkspace = new Workspace();
        testWorkspace.setId(1L);
        testWorkspace.setNom("Test Workspace");
        testWorkspace.setProprietaire(testUser);

        testFolder = new Folder();
        testFolder.setId(1L);
        testFolder.setNom("Test Folder");
        testFolder.setWorkspace(testWorkspace);
        testFolder.setProprietaire(testUser);
        testFolder.setCreatedAt(LocalDateTime.now());
        testFolder.setUpdatedAt(LocalDateTime.now());

        testNote = new Note();
        testNote.setId(1L);
        testNote.setTitre("Test Note");
        testNote.setDossier(testFolder);
    }

    @Test
    @DisplayName("Should find folders by workspace successfully")
    void shouldFindFoldersByWorkspaceSuccessfully() {
        // Given
        Long workspaceId = 1L;
        List<Folder> folders = Arrays.asList(testFolder);
        
        when(workspaceService.findById(workspaceId)).thenReturn(Optional.of(testWorkspace));
        when(workspaceService.hasReadAccess(testWorkspace, testUser)).thenReturn(true);
        when(folderRepository.findByWorkspaceAccessible(testWorkspace, testUser, testUser.getId()))
                .thenReturn(folders);

        // When
        List<Folder> result = folderService.findByWorkspace(workspaceId, testUser);

        // Then
        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        assertThat(result.get(0)).isEqualTo(testFolder);
        
        verify(workspaceService).findById(workspaceId);
        verify(workspaceService).hasReadAccess(testWorkspace, testUser);
        verify(folderRepository).findByWorkspaceAccessible(testWorkspace, testUser, testUser.getId());
    }

    @Test
    @DisplayName("Should throw exception when workspace not found")
    void shouldThrowExceptionWhenWorkspaceNotFound() {
        // Given
        Long workspaceId = 999L;
        when(workspaceService.findById(workspaceId)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> folderService.findByWorkspace(workspaceId, testUser))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Workspace introuvable.");
        
        verify(workspaceService).findById(workspaceId);
        verify(folderRepository, never()).findByWorkspaceAccessible(any(), any(), any());
    }

    @Test
    @DisplayName("Should throw exception when access denied to workspace")
    void shouldThrowExceptionWhenAccessDeniedToWorkspace() {
        // Given
        Long workspaceId = 1L;
        when(workspaceService.findById(workspaceId)).thenReturn(Optional.of(testWorkspace));
        when(workspaceService.hasReadAccess(testWorkspace, testUser)).thenReturn(false);

        // When & Then
        assertThatThrownBy(() -> folderService.findByWorkspace(workspaceId, testUser))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Accès refusé au workspace.");
        
        verify(workspaceService).findById(workspaceId);
        verify(workspaceService).hasReadAccess(testWorkspace, testUser);
        verify(folderRepository, never()).findByWorkspaceAccessible(any(), any(), any());
    }

    @Test
    @DisplayName("Should search folders successfully")
    void shouldSearchFoldersSuccessfully() {
        // Given
        Long workspaceId = 1L;
        String search = "test";
        List<Folder> folders = Arrays.asList(testFolder);
        
        when(workspaceService.findById(workspaceId)).thenReturn(Optional.of(testWorkspace));
        when(workspaceService.hasReadAccess(testWorkspace, testUser)).thenReturn(true);
        when(folderRepository.searchFolders(workspaceId, testUser, testUser.getId(), search))
                .thenReturn(folders);

        // When
        List<Folder> result = folderService.searchFolders(workspaceId, testUser, search);

        // Then
        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        assertThat(result.get(0)).isEqualTo(testFolder);
        
        verify(workspaceService).findById(workspaceId);
        verify(workspaceService).hasReadAccess(testWorkspace, testUser);
        verify(folderRepository).searchFolders(workspaceId, testUser, testUser.getId(), search);
    }

    @Test
    @DisplayName("Should get hierarchy successfully")
    void shouldGetHierarchySuccessfully() {
        // Given
        Long workspaceId = 1L;
        List<Folder> folders = Arrays.asList(testFolder);
        
        when(workspaceService.findById(workspaceId)).thenReturn(Optional.of(testWorkspace));
        when(workspaceService.hasReadAccess(testWorkspace, testUser)).thenReturn(true);
        when(folderRepository.findRootFolders(workspaceId, testUser, testUser.getId()))
                .thenReturn(folders);

        // When
        List<Folder> result = folderService.getHierarchy(workspaceId, testUser);

        // Then
        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        assertThat(result.get(0)).isEqualTo(testFolder);
        
        verify(workspaceService).findById(workspaceId);
        verify(workspaceService).hasReadAccess(testWorkspace, testUser);
        verify(folderRepository).findRootFolders(workspaceId, testUser.getId());
    }

    @Test
    @DisplayName("Should find folder by id successfully")
    void shouldFindFolderByIdSuccessfully() {
        // Given
        Long folderId = 1L;
        when(folderRepository.findById(folderId)).thenReturn(Optional.of(testFolder));

        // When
        Optional<Folder> result = folderService.findById(folderId);

        // Then
        assertThat(result).isPresent();
        assertThat(result.get()).isEqualTo(testFolder);
        
        verify(folderRepository).findById(folderId);
    }

    @Test
    @DisplayName("Should create folder successfully")
    void shouldCreateFolderSuccessfully() {
        // Given
        String nom = "New Folder";
        String description = "New Description";
        Long workspaceId = 1L;
        Long parentId = null;
        String couleur = "#ff0000";
        Boolean isPublic = false;

        when(workspaceService.findById(workspaceId)).thenReturn(Optional.of(testWorkspace));
        when(workspaceService.hasWriteAccess(testWorkspace, testUser)).thenReturn(true);
        when(folderRepository.save(any(Folder.class))).thenReturn(testFolder);

        // When
        Folder result = folderService.createFolder(nom, description, testUser, workspaceId, 
                                                 parentId, couleur, isPublic);

        // Then
        assertThat(result).isNotNull();
        assertThat(result).isEqualTo(testFolder);
        
        verify(workspaceService).findById(workspaceId);
        verify(workspaceService).hasWriteAccess(testWorkspace, testUser);
        verify(folderRepository).save(any(Folder.class));
    }

    @Test
    @DisplayName("Should throw exception when creating folder in workspace without write access")
    void shouldThrowExceptionWhenCreatingFolderWithoutWriteAccess() {
        // Given
        String nom = "New Folder";
        String description = "New Description";
        Long workspaceId = 1L;
        
        when(workspaceService.findById(workspaceId)).thenReturn(Optional.of(testWorkspace));
        when(workspaceService.hasWriteAccess(testWorkspace, testUser)).thenReturn(false);

        // When & Then
        assertThatThrownBy(() -> folderService.createFolder(nom, description, testUser, 
                                                           workspaceId, null, null, false))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Permissions insuffisantes pour créer un dossier dans ce workspace.");
        
        verify(workspaceService).findById(workspaceId);
        verify(workspaceService).hasWriteAccess(testWorkspace, testUser);
        verify(folderRepository, never()).save(any(Folder.class));
    }

    @Test
    @DisplayName("Should update folder successfully")
    void shouldUpdateFolderSuccessfully() {
        // Given
        String newNom = "Updated Folder";
        String newDescription = "Updated Description";
        String newCouleur = "#00ff00";
        Boolean newIsPublic = true;

        when(folderRepository.save(any(Folder.class))).thenReturn(testFolder);

        // When
        Folder result = folderService.updateFolder(testFolder, newNom, newDescription, 
                                                 newCouleur, newIsPublic);

        // Then
        assertThat(result).isNotNull();
        verify(folderRepository).save(testFolder);
    }

    @Test
    @DisplayName("Should delete folder successfully")
    void shouldDeleteFolderSuccessfully() {
        // Given
        Long folderId = 1L;
        when(noteRepository.existsByDossierId(folderId)).thenReturn(false);

        // When
        folderService.deleteFolder(folderId);

        // Then
        verify(noteRepository).existsByDossierId(folderId);
        verify(folderRepository).deleteById(folderId);
    }

    @Test
    @DisplayName("Should throw exception when deleting folder with notes")
    void shouldThrowExceptionWhenDeletingFolderWithNotes() {
        // Given
        Long folderId = 1L;
        when(noteRepository.existsByDossierId(folderId)).thenReturn(true);

        // When & Then
        assertThatThrownBy(() -> folderService.deleteFolder(folderId))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Impossible de supprimer un dossier contenant des notes.");
        
        verify(noteRepository).existsByDossierId(folderId);
        verify(folderRepository, never()).deleteById(any());
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
        
        testFolder.setCollaborateurs(new ArrayList<>());
        
        when(userService.findByEmail(email)).thenReturn(Optional.of(collaborator));
        when(folderRepository.save(any(Folder.class))).thenReturn(testFolder);

        // When
        Folder result = folderService.addCollaborator(testFolder, email, permission);

        // Then
        assertThat(result).isNotNull();
        verify(userService).findByEmail(email);
        verify(folderRepository).save(testFolder);
    }

    @Test
    @DisplayName("Should remove collaborator successfully")
    void shouldRemoveCollaboratorSuccessfully() {
        // Given
        Long userId = 2L;
        Collaborateur collaborateur = new Collaborateur();
        collaborateur.setUserId(userId);
        
        testFolder.setCollaborateurs(new ArrayList<>(Arrays.asList(collaborateur)));
        when(folderRepository.save(any(Folder.class))).thenReturn(testFolder);

        // When
        Folder result = folderService.removeCollaborator(testFolder, userId);

        // Then
        assertThat(result).isNotNull();
        verify(folderRepository).save(testFolder);
    }

    @Test
    @DisplayName("Should check read access for owner")
    void shouldCheckReadAccessForOwner() {
        // When
        boolean hasAccess = folderService.hasReadAccess(testFolder, testUser);

        // Then
        assertThat(hasAccess).isTrue();
    }

    @Test
    @DisplayName("Should check write access for owner")
    void shouldCheckWriteAccessForOwner() {
        // When
        boolean hasAccess = folderService.hasWriteAccess(testFolder, testUser);

        // Then
        assertThat(hasAccess).isTrue();
    }

    @Test
    @DisplayName("Should check admin access for owner")
    void shouldCheckAdminAccessForOwner() {
        // When
        boolean hasAccess = folderService.hasAdminAccess(testFolder, testUser);

        // Then
        assertThat(hasAccess).isTrue();
    }

    @Test
    @DisplayName("Should find notes by folder")
    void shouldFindNotesByFolder() {
        // Given
        Long folderId = 1L;
        String search = null;
        List<Note> notes = Arrays.asList(testNote);
        
        when(noteRepository.findByFolderAccessible(folderId, testUser.getId())).thenReturn(notes);

        // When
        List<Note> result = folderService.findNotesByFolder(folderId, testUser, search);

        // Then
        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        assertThat(result.get(0)).isEqualTo(testNote);
        
        verify(noteRepository).findByFolderAccessible(folderId, testUser.getId());
    }

    @Test
    @DisplayName("Should search notes in folder")
    void shouldSearchNotesInFolder() {
        // Given
        Long folderId = 1L;
        String search = "test";
        List<Note> notes = Arrays.asList(testNote);
        
        when(noteRepository.searchInFolder(folderId, testUser.getId(), search)).thenReturn(notes);

        // When
        List<Note> result = folderService.findNotesByFolder(folderId, testUser, search);

        // Then
        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        assertThat(result.get(0)).isEqualTo(testNote);
        
        verify(noteRepository).searchInFolder(folderId, testUser.getId(), search);
    }
}