package com.mesnotescolab.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mesnotescolab.dto.AddCollaboratorRequest;
import com.mesnotescolab.dto.CreateNoteRequest;
import com.mesnotescolab.dto.UpdateNoteRequest;
import com.mesnotescolab.entity.Note;
import com.mesnotescolab.entity.User;
import com.mesnotescolab.entity.Workspace;
import com.mesnotescolab.service.NoteService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureWebMvc
@ActiveProfiles("test")
@DisplayName("NotesController Integration Tests")
class NotesControllerIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private NoteService noteService;

    private MockMvc mockMvc;
    private User testUser;
    private Workspace testWorkspace;
    private Note testNote;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        testUser = new User();
        testUser.setId(1L);
        testUser.setNom("Test User");
        testUser.setEmail("test@example.com");

        testWorkspace = new Workspace();
        testWorkspace.setId(1L);
        testWorkspace.setNom("Test Workspace");

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
    @DisplayName("Should get notes with pagination")
    void shouldGetNotesWithPagination() throws Exception {
        // Given
        List<Note> notes = Arrays.asList(testNote);
        Page<Note> notePage = new PageImpl<>(notes);
        
        when(noteService.findAccessibleNotes(eq(testUser), eq(1), eq(10), eq(false)))
                .thenReturn(notePage);

        // When & Then
        mockMvc.perform(get("/api/notes")
                .with(user(testUser))
                .param("page", "1")
                .param("limit", "10")
                .param("archived", "false"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.notes").isArray())
                .andExpect(jsonPath("$.data.notes[0].titre").value("Test Note"))
                .andExpect(jsonPath("$.data.pagination").exists());

        verify(noteService).findAccessibleNotes(testUser, 1, 10, false);
    }

    @Test
    @DisplayName("Should search notes")
    void shouldSearchNotes() throws Exception {
        // Given
        List<Note> notes = Arrays.asList(testNote);
        
        when(noteService.searchNotes(testUser, "test")).thenReturn(notes);

        // When & Then
        mockMvc.perform(get("/api/notes")
                .with(user(testUser))
                .param("search", "test"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.notes").isArray())
                .andExpect(jsonPath("$.data.notes[0].titre").value("Test Note"));

        verify(noteService).searchNotes(testUser, "test");
    }

    @Test
    @DisplayName("Should create note successfully")
    void shouldCreateNoteSuccessfully() throws Exception {
        // Given
        CreateNoteRequest request = new CreateNoteRequest(
                "New Note", "New Content", 1L, null, null, 
                Arrays.asList("tag1"), false, "#ffffff"
        );

        when(noteService.createNote(anyString(), anyString(), eq(testUser), anyLong(), 
                                   any(), any(), any(), any(), anyString()))
                .thenReturn(testNote);

        // When & Then
        mockMvc.perform(post("/api/notes")
                .with(user(testUser))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpected(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Note créée avec succès !"))
                .andExpect(jsonPath("$.data.titre").value("Test Note"));

        verify(noteService).createNote("New Note", "New Content", testUser, 1L, 
                                     null, null, Arrays.asList("tag1"), false, "#ffffff");
    }

    @Test
    @DisplayName("Should reject note creation with invalid data")
    void shouldRejectNoteCreationWithInvalidData() throws Exception {
        // Given
        CreateNoteRequest request = new CreateNoteRequest(
                "", "", null, null, null, null, null, null
        ); // Invalid data

        // When & Then
        mockMvc.perform(post("/api/notes")
                .with(user(testUser))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Données invalides."));

        verify(noteService, never()).createNote(anyString(), anyString(), any(), anyLong(), 
                                               any(), any(), any(), any(), anyString());
    }

    @Test
    @DisplayName("Should get note by id successfully")
    void shouldGetNoteByIdSuccessfully() throws Exception {
        // Given
        when(noteService.findById(1L)).thenReturn(Optional.of(testNote));
        when(noteService.hasReadAccess(testNote, testUser)).thenReturn(true);

        // When & Then
        mockMvc.perform(get("/api/notes/1")
                .with(user(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.titre").value("Test Note"))
                .andExpect(jsonPath("$.data.id").value(1));

        verify(noteService).findById(1L);
        verify(noteService).hasReadAccess(testNote, testUser);
    }

    @Test
    @DisplayName("Should return 404 when note not found")
    void shouldReturn404WhenNoteNotFound() throws Exception {
        // Given
        when(noteService.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        mockMvc.perform(get("/api/notes/999")
                .with(user(testUser)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Note introuvable."));

        verify(noteService).findById(999L);
        verify(noteService, never()).hasReadAccess(any(), any());
    }

    @Test
    @DisplayName("Should return 403 when user has no read access")
    void shouldReturn403WhenUserHasNoReadAccess() throws Exception {
        // Given
        when(noteService.findById(1L)).thenReturn(Optional.of(testNote));
        when(noteService.hasReadAccess(testNote, testUser)).thenReturn(false);

        // When & Then
        mockMvc.perform(get("/api/notes/1")
                .with(user(testUser)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Permissions insuffisantes pour cette action."));

        verify(noteService).findById(1L);
        verify(noteService).hasReadAccess(testNote, testUser);
    }

    @Test
    @DisplayName("Should update note successfully")
    void shouldUpdateNoteSuccessfully() throws Exception {
        // Given
        UpdateNoteRequest request = new UpdateNoteRequest(
                "Updated Title", "Updated Content", Arrays.asList("tag2"), true, "#ff0000"
        );

        when(noteService.findById(1L)).thenReturn(Optional.of(testNote));
        when(noteService.hasWriteAccess(testNote, testUser)).thenReturn(true);
        when(noteService.updateNote(eq(testNote), anyString(), anyString(), any(), any(), anyString()))
                .thenReturn(testNote);

        // When & Then
        mockMvc.perform(put("/api/notes/1")
                .with(user(testUser))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Note mise à jour avec succès !"));

        verify(noteService).findById(1L);
        verify(noteService).hasWriteAccess(testNote, testUser);
        verify(noteService).updateNote(testNote, "Updated Title", "Updated Content", 
                                     Arrays.asList("tag2"), true, "#ff0000");
    }

    @Test
    @DisplayName("Should delete note successfully")
    void shouldDeleteNoteSuccessfully() throws Exception {
        // Given
        when(noteService.findById(1L)).thenReturn(Optional.of(testNote));
        when(noteService.hasAdminAccess(testNote, testUser)).thenReturn(true);

        // When & Then
        mockMvc.perform(delete("/api/notes/1")
                .with(user(testUser)))
                .andExpected(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Note supprimée avec succès !"));

        verify(noteService).findById(1L);
        verify(noteService).hasAdminAccess(testNote, testUser);
        verify(noteService).deleteNote(1L);
    }

    @Test
    @DisplayName("Should add collaborator successfully")
    void shouldAddCollaboratorSuccessfully() throws Exception {
        // Given
        AddCollaboratorRequest request = new AddCollaboratorRequest("collaborator@example.com", "lecture");

        when(noteService.findById(1L)).thenReturn(Optional.of(testNote));
        when(noteService.hasAdminAccess(testNote, testUser)).thenReturn(true);
        when(noteService.addCollaborator(testNote, "collaborator@example.com", "lecture"))
                .thenReturn(testNote);

        // When & Then
        mockMvc.perform(post("/api/notes/1/collaborators")
                .with(user(testUser))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Collaborateur ajouté avec succès !"));

        verify(noteService).findById(1L);
        verify(noteService).hasAdminAccess(testNote, testUser);
        verify(noteService).addCollaborator(testNote, "collaborator@example.com", "lecture");
    }

    @Test
    @DisplayName("Should remove collaborator successfully")
    void shouldRemoveCollaboratorSuccessfully() throws Exception {
        // Given
        when(noteService.findById(1L)).thenReturn(Optional.of(testNote));
        when(noteService.hasAdminAccess(testNote, testUser)).thenReturn(true);
        when(noteService.removeCollaborator(testNote, 2L)).thenReturn(testNote);

        // When & Then
        mockMvc.perform(delete("/api/notes/1/collaborators/2")
                .with(user(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Collaborateur retiré avec succès !"));

        verify(noteService).findById(1L);
        verify(noteService).hasAdminAccess(testNote, testUser);
        verify(noteService).removeCollaborator(testNote, 2L);
    }

    @Test
    @DisplayName("Should toggle archive status successfully")
    void shouldToggleArchiveStatusSuccessfully() throws Exception {
        // Given
        when(noteService.findById(1L)).thenReturn(Optional.of(testNote));
        when(noteService.hasAdminAccess(testNote, testUser)).thenReturn(true);
        
        testNote.setIsArchived(true);
        when(noteService.toggleArchive(testNote)).thenReturn(testNote);

        // When & Then
        mockMvc.perform(patch("/api/notes/1/archive")  
                .with(user(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Note archivée avec succès !"));

        verify(noteService).findById(1L);
        verify(noteService).hasAdminAccess(testNote, testUser);
        verify(noteService).toggleArchive(testNote);
    }

    @Test
    @DisplayName("Should get notes by workspace")
    void shouldGetNotesByWorkspace() throws Exception {
        // Given
        List<Note> notes = Arrays.asList(testNote);
        when(noteService.findByWorkspace(1L, testUser)).thenReturn(notes);

        // When & Then
        mockMvc.perform(get("/api/notes/workspace/1")
                .with(user(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].titre").value("Test Note"));

        verify(noteService).findByWorkspace(1L, testUser);
    }

    @Test
    @DisplayName("Should get children notes")
    void shouldGetChildrenNotes() throws Exception {
        // Given
        List<Note> children = Arrays.asList(testNote);
        
        when(noteService.findById(1L)).thenReturn(Optional.of(testNote));
        when(noteService.hasReadAccess(testNote, testUser)).thenReturn(true);
        when(noteService.findChildren(1L, testUser)).thenReturn(children);

        // When & Then
        mockMvc.perform(get("/api/notes/1/children")
                .with(user(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].titre").value("Test Note"));

        verify(noteService).findById(1L);
        verify(noteService).hasReadAccess(testNote, testUser);
        verify(noteService).findChildren(1L, testUser);
    }

    @Test
    @DisplayName("Should require authentication")
    void shouldRequireAuthentication() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/notes"))
                .andExpect(status().isUnauthorized());

        verify(noteService, never()).findAccessibleNotes(any(), anyInt(), anyInt(), any());
    }
}