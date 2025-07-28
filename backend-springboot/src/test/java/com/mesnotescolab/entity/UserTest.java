package com.mesnotescolab.entity;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("User Entity Tests")
class UserTest {

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setNom("Test User");
        user.setEmail("test@example.com");
        user.setMotDePasse("password123");
        user.setIsActive(true);
    }

    @Test
    @DisplayName("Should create user with constructor")
    void shouldCreateUserWithConstructor() {
        // When
        User newUser = new User("John Doe", "john@example.com", "secret123");

        // Then
        assertThat(newUser.getNom()).isEqualTo("John Doe");
        assertThat(newUser.getEmail()).isEqualTo("john@example.com");
        assertThat(newUser.getMotDePasse()).isEqualTo("secret123");
        assertThat(newUser.getIdioma()).isEqualTo(User.Idioma.PT); // Default language
        assertThat(newUser.getIsActive()).isTrue(); // Default active
    }

    @Test
    @DisplayName("Should create user with default constructor")
    void shouldCreateUserWithDefaultConstructor() {
        // When
        User newUser = new User();

        // Then
        assertThat(newUser.getNom()).isNull();
        assertThat(newUser.getEmail()).isNull();
        assertThat(newUser.getMotDePasse()).isNull();
        assertThat(newUser.getIdioma()).isEqualTo(User.Idioma.PT); // Default language
        assertThat(newUser.getIsActive()).isTrue(); // Default active
    }

    @Test
    @DisplayName("Should implement UserDetails interface correctly")
    void shouldImplementUserDetailsInterfaceCorrectly() {
        // Then
        assertThat(user.getUsername()).isEqualTo("test@example.com");
        assertThat(user.getPassword()).isEqualTo("password123");
        assertThat(user.getAuthorities()).isEmpty();
        assertThat(user.isAccountNonExpired()).isTrue();
        assertThat(user.isAccountNonLocked()).isTrue();
        assertThat(user.isCredentialsNonExpired()).isTrue();
        assertThat(user.isEnabled()).isTrue();
    }

    @Test
    @DisplayName("Should return false for isEnabled when user is inactive")
    void shouldReturnFalseForIsEnabledWhenUserIsInactive() {
        // Given
        user.setIsActive(false);

        // Then
        assertThat(user.isEnabled()).isFalse();
    }

    @Test
    @DisplayName("Should update last login")
    void shouldUpdateLastLogin() {
        // Given
        LocalDateTime beforeUpdate = LocalDateTime.now().minusMinutes(1);

        // When
        user.updateLastLogin();

        // Then
        assertThat(user.getDerniereConnexion()).isAfter(beforeUpdate);
        assertThat(user.getDerniereConnexion()).isBeforeOrEqualTo(LocalDateTime.now());
    }

    @Test
    @DisplayName("Should set and get all properties correctly")
    void shouldSetAndGetAllPropertiesCorrectly() {
        // Given
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime created = now.minusDays(1);
        LocalDateTime updated = now.minusHours(1);

        // When
        user.setId(2L);
        user.setNom("Updated User");
        user.setEmail("updated@example.com");
        user.setIdioma(User.Idioma.EN);
        user.setMotDePasse("newpassword");
        user.setAvatar("avatar-url");
        user.setIsActive(false);
        user.setDerniereConnexion(now);
        user.setCreatedAt(created);
        user.setUpdatedAt(updated);

        // Then
        assertThat(user.getId()).isEqualTo(2L);
        assertThat(user.getNom()).isEqualTo("Updated User");
        assertThat(user.getEmail()).isEqualTo("updated@example.com");
        assertThat(user.getIdioma()).isEqualTo(User.Idioma.EN);
        assertThat(user.getMotDePasse()).isEqualTo("newpassword");
        assertThat(user.getAvatar()).isEqualTo("avatar-url");
        assertThat(user.getIsActive()).isFalse();
        assertThat(user.getDerniereConnexion()).isEqualTo(now);
        assertThat(user.getCreatedAt()).isEqualTo(created);
        assertThat(user.getUpdatedAt()).isEqualTo(updated);
    }

    @Test
    @DisplayName("Should handle all Idioma enum values")
    void shouldHandleAllIdiomaEnumValues() {
        // Test PT
        user.setIdioma(User.Idioma.PT);
        assertThat(user.getIdioma()).isEqualTo(User.Idioma.PT);

        // Test FR
        user.setIdioma(User.Idioma.FR);
        assertThat(user.getIdioma()).isEqualTo(User.Idioma.FR);

        // Test EN
        user.setIdioma(User.Idioma.EN);
        assertThat(user.getIdioma()).isEqualTo(User.Idioma.EN);

        // Test DE
        user.setIdioma(User.Idioma.DE);
        assertThat(user.getIdioma()).isEqualTo(User.Idioma.DE);
    }

    @Test
    @DisplayName("Should handle null values gracefully")
    void shouldHandleNullValuesGracefully() {
        // When
        user.setNom(null);
        user.setEmail(null);
        user.setMotDePasse(null);
        user.setAvatar(null);
        user.setIsActive(null);
        user.setDerniereConnexion(null);
        user.setCreatedAt(null);
        user.setUpdatedAt(null);

        // Then
        assertThat(user.getNom()).isNull();
        assertThat(user.getEmail()).isNull();
        assertThat(user.getMotDePasse()).isNull();
        assertThat(user.getAvatar()).isNull();
        assertThat(user.getIsActive()).isNull();
        assertThat(user.getDerniereConnexion()).isNull();
        assertThat(user.getCreatedAt()).isNull();
        assertThat(user.getUpdatedAt()).isNull();
    }

    @Test
    @DisplayName("Should handle relationships collections")
    void shouldHandleRelationshipsCollections() {
        // When - setting to null shouldn't break anything
        user.setWorkspaces(null);
        user.setFolders(null);
        user.setNotes(null);
        user.setNotifications(null);

        // Then
        assertThat(user.getWorkspaces()).isNull();
        assertThat(user.getFolders()).isNull();
        assertThat(user.getNotes()).isNull();
        assertThat(user.getNotifications()).isNull();
    }

    @Test
    @DisplayName("Should have default values set correctly")
    void shouldHaveDefaultValuesSetCorrectly() {
        // Given
        User newUser = new User();

        // Then
        assertThat(newUser.getIdioma()).isEqualTo(User.Idioma.PT);
        assertThat(newUser.getIsActive()).isTrue();
        assertThat(newUser.getDerniereConnexion()).isNotNull();
        assertThat(newUser.getDerniereConnexion()).isBeforeOrEqualTo(LocalDateTime.now());
    }

    @Test
    @DisplayName("Should maintain consistency in UserDetails methods")
    void shouldMaintainConsistencyInUserDetailsMethods() {
        // Test active user
        user.setIsActive(true);
        assertThat(user.isEnabled()).isTrue();

        // Test inactive user
        user.setIsActive(false);
        assertThat(user.isEnabled()).isFalse();

        // Test null active status
        user.setIsActive(null);
        assertThat(user.isEnabled()).isFalse(); // Should handle null gracefully
    }
}