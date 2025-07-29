package com.mesnotescolab.repository;

import com.mesnotescolab.entity.Note;
import com.mesnotescolab.entity.User;
import com.mesnotescolab.entity.Workspace;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
@DisplayName("NoteRepository Tests")
class NoteRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private NoteRepository noteRepository;

    private User testUser;
    private User otherUser;
    private Workspace testWorkspace;
    private Note testNote;
    private Note publicNote;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setNom("Test User");
        testUser.setEmail("test@example.com");
        testUser.setMotDePasse("password");
        testUser.setIsActive(true);
        testUser.setCreatedAt(LocalDateTime.now());
        testUser.setUpdatedAt(LocalDateTime.now());
        testUser = entityManager.persistAndFlush(testUser);

        otherUser = new User();
        otherUser.setNom("Other User");
        otherUser.setEmail("other@example.com");
        otherUser.setMotDePasse("password");
        otherUser.setIsActive(true);
        otherUser.setCreatedAt(LocalDateTime.now());
        otherUser.setUpdatedAt(LocalDateTime.now());
        otherUser = entityManager.persistAndFlush(otherUser);

        testWorkspace = new Workspace();
        testWorkspace.setNom("Test Workspace");
        testWorkspace.setProprietaire(testUser);
        testWorkspace.setCreatedAt(LocalDateTime.now());
        testWorkspace.setUpdatedAt(LocalDateTime.now());
        testWorkspace = entityManager.persistAndFlush(testWorkspace);

        testNote = new Note();
        testNote.setTitre("Test Note");
        testNote.setContenu("Test Content"); 
        testNote.setAuteur(testUser);
        testNote.setWorkspace(testWorkspace);
        testNote.setIsPublic(false);
        testNote.setIsArchived(false);
        testNote.setCreatedAt(LocalDateTime.now());
        testNote.setUpdatedAt(LocalDateTime.now());
        testNote = entityManager.persistAndFlush(testNote);

        publicNote = new Note();
        publicNote.setTitre("Public Note");
        publicNote.setContenu("Public Content");
        publicNote.setAuteur(otherUser);
        publicNote.setWorkspace(testWorkspace);
        publicNote.setIsPublic(true);
        publicNote.setIsArchived(false);
        publicNote.setCreatedAt(LocalDateTime.now());
        publicNote.setUpdatedAt(LocalDateTime.now());
        publicNote = entityManager.persistAndFlush(publicNote);
    }

    @Test
    @DisplayName("Should find accessible notes for owner")
    void shouldFindAccessibleNotesForOwner() {
        // When
        Page<Note> result = noteRepository.findAccessibleNotes(
                testUser, testUser.getId(), false, PageRequest.of(0, 10));

        // Then
        assertThat(result.getContent()).hasSize(2); // Own note + public note
        assertThat(result.getContent()).extracting(Note::getTitre)
                .containsExactlyInAnyOrder("Test Note", "Public Note");
    }

    @Test
    @DisplayName("Should find only public notes for non-owner")
    void shouldFindOnlyPublicNotesForNonOwner() {
        // When
        Page<Note> result = noteRepository.findAccessibleNotes(
                otherUser, otherUser.getId(), false, PageRequest.of(0, 10));

        // Then
        assertThat(result.getContent()).hasSize(1); // Only public note
        assertThat(result.getContent().get(0).getTitre()).isEqualTo("Public Note");
    }

    @Test
    @DisplayName("Should find archived notes when requested")
    void shouldFindArchivedNotesWhenRequested() {
        // Given
        testNote.setIsArchived(true);
        entityManager.persistAndFlush(testNote);

        // When
        Page<Note> result = noteRepository.findAccessibleNotes(
                testUser, testUser.getId(), true, PageRequest.of(0, 10));

        // Then
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getTitre()).isEqualTo("Test Note");
        assertThat(result.getContent().get(0).getIsArchived()).isTrue();
    }

    @Test
    @DisplayName("Should search notes by content")
    void shouldSearchNotesByContent() {
        // When
        List<Note> result = noteRepository.searchNotes(testUser, testUser.getId(), "Test");

        // Then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTitre()).isEqualTo("Test Note");
    }

    @Test
    @DisplayName("Should search notes by title")
    void shouldSearchNotesByTitle() {
        // When
        List<Note> result = noteRepository.searchNotes(testUser, testUser.getId(), "Public");

        // Then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTitre()).isEqualTo("Public Note");
    }

    @Test
    @DisplayName("Should find notes by workspace")
    void shouldFindNotesByWorkspace() {
        // When
        List<Note> result = noteRepository.findByWorkspaceAccessible(testWorkspace, testUser, testUser.getId());

        // Then
        assertThat(result).hasSize(2); // Both notes are in the same workspace
        assertThat(result).extracting(Note::getTitre)
                .containsExactlyInAnyOrder("Test Note", "Public Note");
    }

    @Test
    @DisplayName("Should find notes by title containing ignore case")
    void shouldFindNotesByTitleContainingIgnoreCase() {
        // When
        List<Note> result = noteRepository.findByTitleContainingIgnoreCase("test", testUser, testUser.getId());

        // Then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTitre()).isEqualTo("Test Note");
    }

    @Test
    @DisplayName("Should count notes by author and archived status")
    void shouldCountNotesByAuthorAndArchivedStatus() {
        // When
        long count = noteRepository.countByAuteurAndIsArchived(testUser, false);

        // Then
        assertThat(count).isEqualTo(1); // Only the test note belongs to testUser
    }

    @Test
    @DisplayName("Should count public notes by author")
    void shouldCountPublicNotesByAuthor() {
        // When
        long count = noteRepository.countByAuteurAndIsPublic(testUser, true);

        // Then
        assertThat(count).isEqualTo(0); // testUser's note is private

        long publicCount = noteRepository.countByAuteurAndIsPublic(otherUser, true);
        assertThat(publicCount).isEqualTo(1); // otherUser's note is public
    }

    @Test
    @DisplayName("Should check if notes exist by workspace id")
    void shouldCheckIfNotesExistByWorkspaceId() {
        // When
        boolean exists = noteRepository.existsByWorkspaceId(testWorkspace.getId());
        boolean notExists = noteRepository.existsByWorkspaceId(999L);

        // Then
        assertThat(exists).isTrue();
        assertThat(notExists).isFalse();
    }

    @Test
    @DisplayName("Should find children notes")
    void shouldFindChildrenNotes() {
        // Given
        Note childNote = new Note();
        childNote.setTitre("Child Note");
        childNote.setContenu("Child Content");
        childNote.setAuteur(testUser);
        childNote.setWorkspace(testWorkspace);
        childNote.setParent(testNote);
        childNote.setIsPublic(false);
        childNote.setIsArchived(false);
        childNote.setCreatedAt(LocalDateTime.now());
        childNote.setUpdatedAt(LocalDateTime.now());
        entityManager.persistAndFlush(childNote);

        // When
        List<Note> children = noteRepository.findChildren(testNote.getId(), testUser.getId());

        // Then
        assertThat(children).hasSize(1);
        assertThat(children.get(0).getTitre()).isEqualTo("Child Note");
        assertThat(children.get(0).getParent().getId()).isEqualTo(testNote.getId());
    }

    @Test
    @DisplayName("Should save note with tags")
    void shouldSaveNoteWithTags() {
        // Given
        Note noteWithTags = new Note();
        noteWithTags.setTitre("Tagged Note");
        noteWithTags.setContenu("Content with tags");
        noteWithTags.setAuteur(testUser);
        noteWithTags.setWorkspace(testWorkspace);
        noteWithTags.setTags(Arrays.asList("tag1", "tag2", "tag3"));
        noteWithTags.setIsPublic(false);
        noteWithTags.setIsArchived(false);
        noteWithTags.setCreatedAt(LocalDateTime.now());
        noteWithTags.setUpdatedAt(LocalDateTime.now());

        // When
        Note saved = noteRepository.save(noteWithTags);

        // Then
        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getTags()).hasSize(3);
        assertThat(saved.getTags()).containsExactly("tag1", "tag2", "tag3");
    }

    @Test
    @DisplayName("Should update note content")
    void shouldUpdateNoteContent() {
        // Given
        String newTitle = "Updated Title";
        String newContent = "Updated Content";

        // When
        testNote.setTitre(newTitle);
        testNote.setContenu(newContent);
        testNote.setUpdatedAt(LocalDateTime.now());
        Note updated = noteRepository.save(testNote);

        // Then
        assertThat(updated.getTitre()).isEqualTo(newTitle);
        assertThat(updated.getContenu()).isEqualTo(newContent);
        assertThat(updated.getId()).isEqualTo(testNote.getId());
    }

    @Test
    @DisplayName("Should delete note")
    void shouldDeleteNote() {
        // Given
        Long noteId = testNote.getId();

        // When
        noteRepository.delete(testNote);

        // Then
        assertThat(noteRepository.findById(noteId)).isEmpty();
    }

    @Test
    @DisplayName("Should find notes with pagination")
    void shouldFindNotesWithPagination() {
        // Given - Create more test notes
        for (int i = 0; i < 15; i++) {
            Note note = new Note();
            note.setTitre("Note " + i);
            note.setContenu("Content " + i);
            note.setAuteur(testUser);
            note.setWorkspace(testWorkspace);
            note.setIsPublic(false);
            note.setIsArchived(false);
            note.setCreatedAt(LocalDateTime.now());
            note.setUpdatedAt(LocalDateTime.now());
            entityManager.persistAndFlush(note);
        }

        // When
        Page<Note> firstPage = noteRepository.findAccessibleNotes(
                testUser, testUser.getId(), false, PageRequest.of(0, 10));
        Page<Note> secondPage = noteRepository.findAccessibleNotes(
                testUser, testUser.getId(), false, PageRequest.of(1, 10));

        // Then
        assertThat(firstPage.getContent()).hasSize(10);
        assertThat(secondPage.getContent()).hasSize(7); // 15 new + 2 existing = 17 total, second page has 7
        assertThat(firstPage.getTotalElements()).isEqualTo(17);
        assertThat(firstPage.getTotalPages()).isEqualTo(2);
    }
}