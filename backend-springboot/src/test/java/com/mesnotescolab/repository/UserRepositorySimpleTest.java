package com.mesnotescolab.repository;

import com.mesnotescolab.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
@DisplayName("UserRepository Simple Tests")
class UserRepositorySimpleTest {

    @Autowired
    private UserRepository userRepository;

    private User testUser;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        
        testUser = new User();
        testUser.setNom("Test User");
        testUser.setEmail("test@example.com");
        testUser.setMotDePasse("password123");
        testUser.setIsActive(true);
    }

    @Test
    @DisplayName("Should save and find user by email")
    void shouldSaveAndFindUserByEmail() {
        // Given
        User savedUser = userRepository.save(testUser);

        // When
        Optional<User> found = userRepository.findByEmail("test@example.com");

        // Then
        assertThat(found).isPresent();
        assertThat(found.get().getEmail()).isEqualTo("test@example.com");
        assertThat(found.get().getNom()).isEqualTo("Test User");
        assertThat(found.get().getId()).isEqualTo(savedUser.getId());
    }

    @Test
    @DisplayName("Should return empty when user not found")
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
        userRepository.save(testUser);

        // When & Then
        assertThat(userRepository.existsByEmail("test@example.com")).isTrue();
        assertThat(userRepository.existsByEmail("nonexistent@example.com")).isFalse();
    }

    @Test
    @DisplayName("Should find active user by email")
    void shouldFindActiveUserByEmail() {
        // Given
        userRepository.save(testUser);

        // When
        Optional<User> found = userRepository.findActiveUserByEmail("test@example.com");

        // Then
        assertThat(found).isPresent();
        assertThat(found.get().getIsActive()).isTrue();
    }

    @Test
    @DisplayName("Should not find inactive user")
    void shouldNotFindInactiveUser() {
        // Given
        testUser.setIsActive(false);
        userRepository.save(testUser);

        // When
        Optional<User> found = userRepository.findActiveUserByEmail("test@example.com");

        // Then
        assertThat(found).isEmpty();
    }

    @Test
    @DisplayName("Should save user with all basic fields")
    void shouldSaveUserWithAllBasicFields() {
        // Given
        User newUser = new User();
        newUser.setNom("Complete User");
        newUser.setEmail("complete@example.com");
        newUser.setMotDePasse("password123");
        newUser.setAvatar("avatar-url");
        newUser.setIdioma(User.Idioma.FR);
        newUser.setIsActive(true);

        // When
        User saved = userRepository.save(newUser);

        // Then
        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getNom()).isEqualTo("Complete User");
        assertThat(saved.getEmail()).isEqualTo("complete@example.com");
        assertThat(saved.getAvatar()).isEqualTo("avatar-url");
        assertThat(saved.getIdioma()).isEqualTo(User.Idioma.FR);
        assertThat(saved.getIsActive()).isTrue();
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getUpdatedAt()).isNotNull();
    }

    @Test
    @DisplayName("Should update user fields")
    void shouldUpdateUserFields() {
        // Given
        User saved = userRepository.save(testUser);
        
        // When
        saved.setNom("Updated User");
        saved.setAvatar("new-avatar");
        User updated = userRepository.save(saved);

        // Then
        assertThat(updated.getNom()).isEqualTo("Updated User");
        assertThat(updated.getAvatar()).isEqualTo("new-avatar");
    }

    @Test
    @DisplayName("Should delete user")
    void shouldDeleteUser() {
        // Given
        User saved = userRepository.save(testUser);
        Long userId = saved.getId();

        // When
        userRepository.delete(saved);

        // Then
        assertThat(userRepository.findById(userId)).isEmpty();
    }
}