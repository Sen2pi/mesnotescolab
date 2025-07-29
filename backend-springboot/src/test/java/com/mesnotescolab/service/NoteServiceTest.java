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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("NoteService Tests")
class NoteServiceTest {

    @Mock
    private NoteRepository noteRepository;
    
    @Mock
    private WorkspaceRepository workspaceRepository;
    
    @Mock
    private FolderRepository folderRepository;
    
    @Mock
    private UserRepository userRepository;
    
    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private NoteService noteService;

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

        testNote = new Note();
        testNote.setId(1L);
        testNote.setTitre("Test Note");
        testNote.setContenu("Test Content");
        testNote.setAuteur(testUser);
        testNote.setWorkspace(testWorkspace);
        testNote.setCreatedAt(LocalDateTime.now());
        testNote.setUpdatedAt(LocalDateTime.now());
    }

    @Test
    @DisplayName("Should find accessible notes with pagination")
    void shouldFindAccessibleNotesWithPagination() {
        // Given
        int page = 1;
        int limit = 10;
        Boolean archived = false;
        
        List<Note> notes = Arrays.asList(testNote);
        Page<Note> notePage = new PageImpl<>(notes, PageRequest.of(0, limit), 1);
        
        when(noteRepository.findAccessibleNotes(eq(testUser), eq(testUser.getId()), eq(archived), any(Pageable.class)))
                .thenReturn(notePage);

        // When
        Page<Note> result = noteService.findAccessibleNotes(testUser, page, limit, archived);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0)).isEqualTo(testNote);
        
        verify(noteRepository).findAccessibleNotes(eq(testUser), eq(testUser.getId()), eq(archived), any(Pageable.class));
    }

    @Test
    @DisplayName("Should search notes successfully")
    void shouldSearchNotesSuccessfully() {
        // Given
        String searchTerm = "test";
        List<Note> notes = Arrays.asList(testNote);
        
        when(noteRepository.searchNotes(testUser, testUser.getId(), searchTerm))
                .thenReturn(notes);

        // When
        List<Note> result = noteService.searchNotes(testUser, searchTerm);

        // Then
        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        assertThat(result.get(0)).isEqualTo(testNote);
        
        verify(noteRepository).searchNotes(testUser, testUser.getId(), searchTerm);
    }

    @Test
    @DisplayName("Should create note successfully")
    void shouldCreateNoteSuccessfully() {
        // Given
        String titre = "New Note";
        String contenu = "New Content";
        Long workspaceId = 1L;
        Long dossierId = 1L;
        Long parentId = null;
        List<String> tags = Arrays.asList("tag1", "tag2");
        Boolean isPublic = false;
        String couleur = "#ffffff";

        when(workspaceRepository.findById(workspaceId)).thenReturn(Optional.of(testWorkspace));
        when(folderRepository.findById(dossierId)).thenReturn(Optional.of(testFolder));
        when(noteRepository.save(any(Note.class))).thenReturn(testNote);

        // When
        Note result = noteService.createNote(titre, contenu, testUser, workspaceId, 
                                           dossierId, parentId, tags, isPublic, couleur);

        // Then
        assertThat(result).isNotNull();
        assertThat(result).isEqualTo(testNote);
        
        verify(workspaceRepository).findById(workspaceId);
        verify(folderRepository).findById(dossierId);
        verify(noteRepository).save(any(Note.class));
    }

    @Test
    @DisplayName("Should throw exception when workspace not found")
    void shouldThrowExceptionWhenWorkspaceNotFound() {
        // Given
        Long workspaceId = 999L;
        when(workspaceRepository.findById(workspaceId)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> noteService.createNote("Title", "Content", testUser, 
                                                       workspaceId, null, null, null, false, null))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Workspace non trouvé");
        
        verify(workspaceRepository).findById(workspaceId);
        verify(noteRepository, never()).save(any(Note.class));
    }

    @Test
    @DisplayName("Should find note by id successfully")
    void shouldFindNoteByIdSuccessfully() {
        // Given
        Long noteId = 1L;
        when(noteRepository.findById(noteId)).thenReturn(Optional.of(testNote));

        // When
        Optional<Note> result = noteService.findById(noteId);

        // Then
        assertThat(result).isPresent();
        assertThat(result.get()).isEqualTo(testNote);
        
        verify(noteRepository).findById(noteId);
    }

    @Test
    @DisplayName("Should update note successfully")
    void shouldUpdateNoteSuccessfully() {
        // Given
        String newTitre = "Updated Title";
        String newContenu = "Updated Content";
        List<String> newTags = Arrays.asList("new-tag");
        Boolean newIsPublic = true;
        String newCouleur = "#ff0000";

        when(noteRepository.save(any(Note.class))).thenReturn(testNote);

        // When
        Note result = noteService.updateNote(testNote, newTitre, newContenu, newTags, newIsPublic, newCouleur);

        // Then
        assertThat(result).isNotNull();
        verify(noteRepository).save(testNote);
    }

    @Test
    @DisplayName("Should delete note successfully")
    void shouldDeleteNoteSuccessfully() {
        // Given
        Long noteId = 1L;

        // When
        noteService.deleteNote(noteId);

        // Then
        verify(notificationRepository).deleteByNoteId(noteId);
        verify(noteRepository).deleteById(noteId);
    }

    @Test
    @DisplayName("Should toggle archive status")
    void shouldToggleArchiveStatus() {
        // Given
        testNote.setIsArchived(false);
        when(noteRepository.save(any(Note.class))).thenReturn(testNote);

        // When
        Note result = noteService.toggleArchive(testNote);

        // Then
        assertThat(result).isNotNull();
        verify(noteRepository).save(testNote);
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
        
        testNote.setCollaborateurs(new ArrayList<>());
        
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(collaborator));
        when(noteRepository.save(any(Note.class))).thenReturn(testNote);

        // When
        Note result = noteService.addCollaborator(testNote, email, permission);

        // Then
        assertThat(result).isNotNull();
        verify(userRepository).findByEmail(email);
        verify(noteRepository).save(testNote);
    }

    @Test
    @DisplayName("Should throw exception when adding author as collaborator")
    void shouldThrowExceptionWhenAddingAuthorAsCollaborator() {
        // Given
        String authorEmail = testUser.getEmail();
        String permission = "lecture";
        
        when(userRepository.findByEmail(authorEmail)).thenReturn(Optional.of(testUser));

        // When & Then
        assertThatThrownBy(() -> noteService.addCollaborator(testNote, authorEmail, permission))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("L'auteur ne peut pas être ajouté comme collaborateur");
        
        verify(userRepository).findByEmail(authorEmail);
        verify(noteRepository, never()).save(any(Note.class));
    }

    @Test
    @DisplayName("Should remove collaborator successfully")
    void shouldRemoveCollaboratorSuccessfully() {
        // Given
        Long userId = 2L;
        Collaborateur collaborateur = new Collaborateur();
        collaborateur.setUserId(userId);
        
        testNote.setCollaborateurs(new ArrayList<>(Arrays.asList(collaborateur)));
        when(noteRepository.save(any(Note.class))).thenReturn(testNote);

        // When
        Note result = noteService.removeCollaborator(testNote, userId);

        // Then
        assertThat(result).isNotNull();
        verify(noteRepository).save(testNote);
    }

    @Test
    @DisplayName("Should check read access for author")
    void shouldCheckReadAccessForAuthor() {
        // When
        boolean hasAccess = noteService.hasReadAccess(testNote, testUser);

        // Then
        assertThat(hasAccess).isTrue();
    }

    @Test
    @DisplayName("Should check read access for public note")
    void shouldCheckReadAccessForPublicNote() {
        // Given
        testNote.setIsPublic(true);
        User otherUser = new User();
        otherUser.setId(2L);

        // When
        boolean hasAccess = noteService.hasReadAccess(testNote, otherUser);

        // Then
        assertThat(hasAccess).isTrue();
    }

    @Test
    @DisplayName("Should check write access for author")
    void shouldCheckWriteAccessForAuthor() {
        // When
        boolean hasAccess = noteService.hasWriteAccess(testNote, testUser);

        // Then
        assertThat(hasAccess).isTrue();
    }

    @Test
    @DisplayName("Should check admin access for author")
    void shouldCheckAdminAccessForAuthor() {
        // When
        boolean hasAccess = noteService.hasAdminAccess(testNote, testUser);

        // Then
        assertThat(hasAccess).isTrue();
    }

    @Test
    @DisplayName("Should find notes by workspace")
    void shouldFindNotesByWorkspace() {
        // Given
        Long workspaceId = 1L;
        List<Note> notes = Arrays.asList(testNote);
        
        when(noteRepository.findByWorkspace(workspaceId, testUser.getId())).thenReturn(notes);

        // When
        List<Note> result = noteService.findByWorkspace(workspaceId, testUser);

        // Then
        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        assertThat(result.get(0)).isEqualTo(testNote);
        
        verify(noteRepository).findByWorkspace(workspaceId, testUser.getId());
    }

    @Test
    @DisplayName("Should find children notes")
    void shouldFindChildrenNotes() {
        // Given
        Long parentId = 1L;
        List<Note> notes = Arrays.asList(testNote);
        
        when(noteRepository.findChildren(parentId, testUser.getId())).thenReturn(notes);

        // When
        List<Note> result = noteService.findChildren(parentId, testUser);

        // Then
        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        assertThat(result.get(0)).isEqualTo(testNote);
        
        verify(noteRepository).findChildren(parentId, testUser.getId());
    }

    @Test
    @DisplayName("Should search notes by title")
    void shouldSearchNotesByTitle() {
        // Given
        String search = "test";
        List<Note> notes = Arrays.asList(testNote);
        
        when(noteRepository.findByTitleContainingIgnoreCase(search, testUser, testUser.getId()))
                .thenReturn(notes);

        // When
        List<Note> result = noteService.searchByTitle(search, testUser);

        // Then
        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        assertThat(result.get(0)).isEqualTo(testNote);
        
        verify(noteRepository).findByTitleContainingIgnoreCase(search, testUser, testUser.getId());
    }
}