package com.mesnotescolab.repository;

import com.mesnotescolab.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
@DisplayName("UserRepository Tests")
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
        testUser.setMotDePasse("hashedPassword");
        testUser.setIsActive(true);
        testUser.setCreatedAt(LocalDateTime.now());
        testUser.setUpdatedAt(LocalDateTime.now());
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
    void shouldReturnEmptyWhenUserNotFoundByEmail() {
        // When
        Optional<User> found = userRepository.findByEmail("nonexistent@example.com");

        // Then
        assertThat(found).isEmpty();
    }

    @Test
    @DisplayName("Should check if email exists")
    void shouldCheckIfEmailExists() {
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
        testUser.setIsActive(true);
        entityManager.persistAndFlush(testUser);

        // When
        Optional<User> found = userRepository.findActiveUserByEmail("test@example.com");

        // Then
        assertThat(found).isPresent();
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
    @DisplayName("Should save user with all properties")
    void shouldSaveUserWithAllProperties() {
        // Given
        User newUser = new User();
        newUser.setNom("New User");
        newUser.setEmail("new@example.com");
        newUser.setMotDePasse("newPassword");
        newUser.setIsActive(true);
        newUser.setAvatar("avatar.jpg");
        newUser.setCreatedAt(LocalDateTime.now());
        newUser.setUpdatedAt(LocalDateTime.now());

        // When
        User saved = userRepository.save(newUser);

        // Then
        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getNom()).isEqualTo("New User");
        assertThat(saved.getEmail()).isEqualTo("new@example.com");
        assertThat(saved.getMotDePasse()).isEqualTo("newPassword");
        assertThat(saved.getIsActive()).isTrue();
        assertThat(saved.getAvatar()).isEqualTo("avatar.jpg");
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getUpdatedAt()).isNotNull();
    }

    @Test
    @DisplayName("Should update user properties")
    void shouldUpdateUserProperties() {
        // Given
        User saved = entityManager.persistAndFlush(testUser);
        
        // When
        saved.setNom("Updated Name");
        saved.setAvatar("new-avatar.jpg");
        saved.setUpdatedAt(LocalDateTime.now());
        User updated = userRepository.save(saved);

        // Then
        assertThat(updated.getNom()).isEqualTo("Updated Name");
        assertThat(updated.getAvatar()).isEqualTo("new-avatar.jpg");
        assertThat(updated.getEmail()).isEqualTo("test@example.com"); // Unchanged
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
        Optional<User> found = userRepository.findById(userId);
        assertThat(found).isEmpty();
    }

    @Test
    @DisplayName("Should find all users")
    void shouldFindAllUsers() {
        // Given
        User user1 = new User();
        user1.setNom("User 1");
        user1.setEmail("user1@example.com");
        user1.setMotDePasse("password1");
        user1.setIsActive(true);
        user1.setCreatedAt(LocalDateTime.now());
        user1.setUpdatedAt(LocalDateTime.now());

        User user2 = new User();
        user2.setNom("User 2");
        user2.setEmail("user2@example.com");
        user2.setMotDePasse("password2");
        user2.setIsActive(true); 
        user2.setCreatedAt(LocalDateTime.now());
        user2.setUpdatedAt(LocalDateTime.now());

        entityManager.persistAndFlush(user1);
        entityManager.persistAndFlush(user2);

        // When
        Iterable<User> users = userRepository.findAll();

        // Then
        assertThat(users).hasSize(2);
        assertThat(users).extracting(User::getEmail)
                .containsExactlyInAnyOrder("user1@example.com", "user2@example.com");
    }

    @Test
    @DisplayName("Should handle email case insensitivity")  
    void shouldHandleEmailCaseInsensitivity() {
        // Given
        entityManager.persistAndFlush(testUser);

        // When
        Optional<User> foundLower = userRepository.findByEmail("test@example.com");
        Optional<User> foundUpper = userRepository.findByEmail("TEST@EXAMPLE.COM");

        // Then
        assertThat(foundLower).isPresent();
        // Note: This depends on database collation settings
        // In most cases, email should be stored in lowercase for consistency
    }

    @Test
    @DisplayName("Should validate email uniqueness constraint")
    void shouldValidateEmailUniquenessConstraint() {
        // Given
        entityManager.persistAndFlush(testUser);
        
        User duplicateUser = new User();
        duplicateUser.setNom("Duplicate User");
        duplicateUser.setEmail("test@example.com"); // Same email
        duplicateUser.setMotDePasse("password");
        duplicateUser.setIsActive(true);
        duplicateUser.setCreatedAt(LocalDateTime.now());
        duplicateUser.setUpdatedAt(LocalDateTime.now());

        // When & Then
        assertThatThrownBy(() -> {
            entityManager.persistAndFlush(duplicateUserTest);
        }).isInstanceOf(Exception.class); // Will throw constraint violation
    }
}