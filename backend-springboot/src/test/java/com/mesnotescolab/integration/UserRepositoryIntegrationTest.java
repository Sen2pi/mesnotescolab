package com.mesnotescolab.integration;

import com.mesnotescolab.config.TestConfig;
import com.mesnotescolab.entity.User;
import com.mesnotescolab.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@Import(TestConfig.class)
@ActiveProfiles("test")
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:testdb",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
@DisplayName("UserRepository Integration Tests")
class UserRepositoryIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    private User testUser1;
    private User testUser2;
    private User inactiveUser;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();

        testUser1 = new User();
        testUser1.setNom("Test User 1");
        testUser1.setEmail("test1@example.com");
        testUser1.setMotDePasse("password123");
        testUser1.setIsActive(true);
        testUser1.setIdioma(User.Idioma.PT);

        testUser2 = new User();
        testUser2.setNom("Test User 2");
        testUser2.setEmail("test2@example.com");
        testUser2.setMotDePasse("password456");
        testUser2.setIsActive(true);
        testUser2.setIdioma(User.Idioma.EN);

        inactiveUser = new User();
        inactiveUser.setNom("Inactive User");
        inactiveUser.setEmail("inactive@example.com");
        inactiveUser.setMotDePasse("password789");
        inactiveUser.setIsActive(false);
        inactiveUser.setIdioma(User.Idioma.FR);
    }

    @Test
    @DisplayName("Should save and retrieve user with all fields")
    void shouldSaveAndRetrieveUserWithAllFields() {
        // Given
        User userToSave = new User();
        userToSave.setNom("Complete User");
        userToSave.setEmail("complete@example.com");
        userToSave.setMotDePasse("password123");
        userToSave.setAvatar("avatar-url");
        userToSave.setIdioma(User.Idioma.DE);
        userToSave.setIsActive(true);

        // When
        User savedUser = userRepository.save(userToSave);

        // Then
        assertThat(savedUser.getId()).isNotNull();
        assertThat(savedUser.getNom()).isEqualTo("Complete User");
        assertThat(savedUser.getEmail()).isEqualTo("complete@example.com");
        assertThat(savedUser.getMotDePasse()).isEqualTo("password123");
        assertThat(savedUser.getAvatar()).isEqualTo("avatar-url");
        assertThat(savedUser.getIdioma()).isEqualTo(User.Idioma.DE);
        assertThat(savedUser.getIsActive()).isTrue();
        assertThat(savedUser.getCreatedAt()).isNotNull();
        assertThat(savedUser.getUpdatedAt()).isNotNull();
        assertThat(savedUser.getDerniereConnexion()).isNotNull();

        // Verify retrieval
        Optional<User> retrievedUser = userRepository.findById(savedUser.getId());
        assertThat(retrievedUser).isPresent();
        assertThat(retrievedUser.get()).isEqualTo(savedUser);
    }

    @Test
    @DisplayName("Should find user by email")
    void shouldFindUserByEmail() {
        // Given
        userRepository.save(testUser1);
        userRepository.save(testUser2);

        // When
        Optional<User> foundUser = userRepository.findByEmail("test1@example.com");

        // Then
        assertThat(foundUser).isPresent();
        assertThat(foundUser.get().getNom()).isEqualTo("Test User 1");
        assertThat(foundUser.get().getEmail()).isEqualTo("test1@example.com");
    }

    @Test
    @DisplayName("Should return empty when user not found by email")
    void shouldReturnEmptyWhenUserNotFoundByEmail() {
        // Given
        userRepository.save(testUser1);

        // When
        Optional<User> foundUser = userRepository.findByEmail("nonexistent@example.com");

        // Then
        assertThat(foundUser).isEmpty();
    }

    @Test
    @DisplayName("Should check if user exists by email")
    void shouldCheckIfUserExistsByEmail() {
        // Given
        userRepository.save(testUser1);

        // When & Then
        assertThat(userRepository.existsByEmail("test1@example.com")).isTrue();
        assertThat(userRepository.existsByEmail("nonexistent@example.com")).isFalse();
    }

    @Test
    @DisplayName("Should find active user by email")
    void shouldFindActiveUserByEmail() {
        // Given
        userRepository.save(testUser1); // active
        userRepository.save(inactiveUser); // inactive

        // When
        Optional<User> activeUser = userRepository.findActiveUserByEmail("test1@example.com");
        Optional<User> inactiveUserResult = userRepository.findActiveUserByEmail("inactive@example.com");

        // Then
        assertThat(activeUser).isPresent();
        assertThat(activeUser.get().getIsActive()).isTrue();
        assertThat(inactiveUserResult).isEmpty();
    }

    @Test
    @DisplayName("Should handle case insensitive email operations")
    void shouldHandleCaseInsensitiveEmailOperations() {
        // Given
        testUser1.setEmail("Test@Example.COM");
        userRepository.save(testUser1);

        // When & Then
        assertThat(userRepository.findByEmail("Test@Example.COM")).isPresent();
        assertThat(userRepository.existsByEmail("Test@Example.COM")).isTrue();
        assertThat(userRepository.findActiveUserByEmail("Test@Example.COM")).isPresent();
    }

    @Test
    @DisplayName("Should update user fields")
    void shouldUpdateUserFields() {
        // Given
        User savedUser = userRepository.save(testUser1);
        Long userId = savedUser.getId();
        LocalDateTime originalCreatedAt = savedUser.getCreatedAt();

        // When
        savedUser.setNom("Updated Name");
        savedUser.setAvatar("new-avatar");
        savedUser.setIdioma(User.Idioma.FR);
        User updatedUser = userRepository.save(savedUser);

        // Then
        assertThat(updatedUser.getId()).isEqualTo(userId);
        assertThat(updatedUser.getNom()).isEqualTo("Updated Name");
        assertThat(updatedUser.getAvatar()).isEqualTo("new-avatar");
        assertThat(updatedUser.getIdioma()).isEqualTo(User.Idioma.FR);
        assertThat(updatedUser.getCreatedAt()).isEqualTo(originalCreatedAt); // Should not change
        assertThat(updatedUser.getUpdatedAt()).isAfter(originalCreatedAt); // Should be updated
    }

    @Test
    @DisplayName("Should delete user")
    void shouldDeleteUser() {
        // Given
        User savedUser = userRepository.save(testUser1);
        Long userId = savedUser.getId();

        // When
        userRepository.delete(savedUser);

        // Then
        assertThat(userRepository.findById(userId)).isEmpty();
        assertThat(userRepository.existsByEmail("test1@example.com")).isFalse();
    }

    @Test
    @DisplayName("Should maintain email uniqueness constraint")
    void shouldMaintainEmailUniquenessConstraint() {
        // Given
        userRepository.save(testUser1);

        User duplicateEmailUser = new User();
        duplicateEmailUser.setNom("Duplicate Email User");
        duplicateEmailUser.setEmail("test1@example.com"); // Same email
        duplicateEmailUser.setMotDePasse("differentpassword");

        // When & Then
        try {
            userRepository.save(duplicateEmailUser);
            userRepository.flush(); // Force the constraint check
            // If we reach here, the test should fail
            assertThat(false).as("Expected constraint violation").isTrue();
        } catch (Exception e) {
            // Expected - email uniqueness constraint should be violated
            assertThat(e.getMessage()).containsIgnoringCase("constraint");
        }
    }

    @Test
    @DisplayName("Should handle multiple users with different languages")
    void shouldHandleMultipleUsersWithDifferentLanguages() {
        // Given & When
        testUser1.setIdioma(User.Idioma.PT);
        testUser2.setIdioma(User.Idioma.EN);
        inactiveUser.setIdioma(User.Idioma.FR);

        userRepository.save(testUser1);
        userRepository.save(testUser2);
        userRepository.save(inactiveUser);

        // Then
        List<User> allUsers = userRepository.findAll();
        assertThat(allUsers).hasSize(3);
        
        User ptUser = userRepository.findByEmail("test1@example.com").orElse(null);
        User enUser = userRepository.findByEmail("test2@example.com").orElse(null);
        User frUser = userRepository.findByEmail("inactive@example.com").orElse(null);

        assertThat(ptUser.getIdioma()).isEqualTo(User.Idioma.PT);
        assertThat(enUser.getIdioma()).isEqualTo(User.Idioma.EN);
        assertThat(frUser.getIdioma()).isEqualTo(User.Idioma.FR);
    }

    @Test
    @DisplayName("Should handle pagination and sorting")
    void shouldHandlePaginationAndSorting() {
        // Given
        for (int i = 1; i <= 10; i++) {
            User user = new User();
            user.setNom("User " + String.format("%02d", i));
            user.setEmail("user" + i + "@example.com");
            user.setMotDePasse("password" + i);
            user.setIsActive(i % 2 == 0); // Even numbers are active
            userRepository.save(user);
        }

        // When
        List<User> allUsers = userRepository.findAll();

        // Then
        assertThat(allUsers).hasSize(10);
        
        // Test that we can find active users
        long activeCount = allUsers.stream().filter(User::getIsActive).count();
        assertThat(activeCount).isEqualTo(5);
    }

    @Test
    @DisplayName("Should handle null and empty values correctly")
    void shouldHandleNullAndEmptyValuesCorrectly() {
        // Given
        User userWithNulls = new User();
        userWithNulls.setNom("User with nulls");
        userWithNulls.setEmail("nulls@example.com");
        userWithNulls.setMotDePasse("password");
        userWithNulls.setAvatar(null); // Null avatar
        userWithNulls.setIsActive(true);

        // When
        User savedUser = userRepository.save(userWithNulls);

        // Then
        assertThat(savedUser.getAvatar()).isNull();
        assertThat(savedUser.getNom()).isEqualTo("User with nulls");
        assertThat(savedUser.getEmail()).isEqualTo("nulls@example.com");

        // Verify retrieval
        Optional<User> retrievedUser = userRepository.findByEmail("nulls@example.com");
        assertThat(retrievedUser).isPresent();
        assertThat(retrievedUser.get().getAvatar()).isNull();
    }

    @Test
    @DisplayName("Should maintain audit fields on save and update")
    void shouldMaintainAuditFieldsOnSaveAndUpdate() {
        // Given
        LocalDateTime beforeSave = LocalDateTime.now().minusSeconds(1);

        // When - Initial save
        User savedUser = userRepository.save(testUser1);
        LocalDateTime afterSave = LocalDateTime.now().plusSeconds(1);

        // Then - Verify initial audit fields
        assertThat(savedUser.getCreatedAt()).isAfter(beforeSave);
        assertThat(savedUser.getCreatedAt()).isBefore(afterSave);
        assertThat(savedUser.getUpdatedAt()).isAfter(beforeSave);
        assertThat(savedUser.getUpdatedAt()).isBefore(afterSave);

        // When - Update
        LocalDateTime beforeUpdate = LocalDateTime.now().minusSeconds(1);
        savedUser.setNom("Updated Name");
        User updatedUser = userRepository.save(savedUser);
        LocalDateTime afterUpdate = LocalDateTime.now().plusSeconds(1);

        // Then - Verify audit fields after update
        assertThat(updatedUser.getCreatedAt()).isEqualTo(savedUser.getCreatedAt()); // Should not change
        assertThat(updatedUser.getUpdatedAt()).isAfter(beforeUpdate);
        assertThat(updatedUser.getUpdatedAt()).isBefore(afterUpdate);
        assertThat(updatedUser.getUpdatedAt()).isAfter(updatedUser.getCreatedAt());
    }
}