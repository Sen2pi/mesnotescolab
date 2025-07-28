package com.mesnotescolab.repository;

import com.mesnotescolab.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
@DisplayName("UserRepository Unit Tests")
class UserRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private UserRepository userRepository;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setNom("Test User");
        testUser.setEmail("test@example.com");
        testUser.setMotDePasse("password123");
        testUser.setIsActive(true);
    }

    @Test
    @DisplayName("Should find user by email")
    void shouldFindUserByEmail() {
        // Given
        entityManager.persistAndFlush(testUser);

        // When
        Optional<User> found = userRepository.findByEmail("test@example.com");

        // Then
        assertThat(found).isPresent();
        assertThat(found.get().getEmail()).isEqualTo("test@example.com");
        assertThat(found.get().getNom()).isEqualTo("Test User");
    }

    @Test
    @DisplayName("Should return empty when user not found by email")
    void shouldReturnEmptyWhenUserNotFound() {
        // When
        Optional<User> found = userRepository.findByEmail("nonexistent@example.com");

        // Then
        assertThat(found).isEmpty();
    }

    @Test
    @DisplayName("Should check if user exists by email")
    void shouldCheckIfUserExistsByEmail() {
        // Given
        entityManager.persistAndFlush(testUser);

        // When
        boolean exists = userRepository.existsByEmail("test@example.com");
        boolean notExists = userRepository.existsByEmail("nonexistent@example.com");

        // Then
        assertThat(exists).isTrue();
        assertThat(notExists).isFalse();
    }

    @Test
    @DisplayName("Should find active user by email")
    void shouldFindActiveUserByEmail() {
        // Given
        entityManager.persistAndFlush(testUser);

        // When
        Optional<User> found = userRepository.findActiveUserByEmail("test@example.com");

        // Then
        assertThat(found).isPresent();
        assertThat(found.get().getEmail()).isEqualTo("test@example.com");
        assertThat(found.get().getIsActive()).isTrue();
    }

    @Test
    @DisplayName("Should not find inactive user by email")
    void shouldNotFindInactiveUserByEmail() {
        // Given
        testUser.setIsActive(false);
        entityManager.persistAndFlush(testUser);

        // When
        Optional<User> found = userRepository.findActiveUserByEmail("test@example.com");

        // Then
        assertThat(found).isEmpty();
    }

    @Test
    @DisplayName("Should save user with all required fields")
    void shouldSaveUserWithAllFields() {
        // Given
        User newUser = new User();
        newUser.setNom("New User");
        newUser.setEmail("new@example.com");
        newUser.setMotDePasse("newpassword");
        newUser.setAvatar("avatar-url");
        newUser.setIdioma(User.Idioma.EN);

        // When
        User saved = userRepository.save(newUser);

        // Then
        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getNom()).isEqualTo("New User");
        assertThat(saved.getEmail()).isEqualTo("new@example.com");
        assertThat(saved.getAvatar()).isEqualTo("avatar-url");
        assertThat(saved.getIdioma()).isEqualTo(User.Idioma.EN);
        assertThat(saved.getIsActive()).isTrue();
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getUpdatedAt()).isNotNull();
    }

    @Test
    @DisplayName("Should update user last login")
    void shouldUpdateUserLastLogin() {
        // Given
        User saved = entityManager.persistAndFlush(testUser);
        
        // When
        saved.updateLastLogin();
        User updated = userRepository.save(saved);

        // Then
        assertThat(updated.getDerniereConnexion()).isNotNull();
        assertThat(updated.getUpdatedAt()).isNotNull();
    }

    @Test
    @DisplayName("Should handle email case insensitivity")
    void shouldHandleEmailCaseInsensitivity() {
        // Given
        testUser.setEmail("Test@Example.COM");
        entityManager.persistAndFlush(testUser);

        // When
        Optional<User> found = userRepository.findByEmail("Test@Example.COM");
        boolean exists = userRepository.existsByEmail("Test@Example.COM");

        // Then
        assertThat(found).isPresent();
        assertThat(exists).isTrue();
    }

    @Test
    @DisplayName("Should delete user")
    void shouldDeleteUser() {
        // Given
        User saved = entityManager.persistAndFlush(testUser);
        Long userId = saved.getId();

        // When
        userRepository.delete(saved);

        // Then
        assertThat(userRepository.findById(userId)).isEmpty();
    }
}