package com.mesnotescolab.dto;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("RegisterRequest DTO Tests")
class RegisterRequestTest {

    private Validator validator;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    @DisplayName("Should create valid RegisterRequest")
    void shouldCreateValidRegisterRequest() {
        // Given
        RegisterRequest registerRequest = new RegisterRequest("Test User", "test@example.com", "password123");

        // When
        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(registerRequest);

        // Then
        assertThat(violations).isEmpty();
        assertThat(registerRequest.getNom()).isEqualTo("Test User");
        assertThat(registerRequest.getEmail()).isEqualTo("test@example.com");
        assertThat(registerRequest.getMotDePasse()).isEqualTo("password123");
    }

    @Test
    @DisplayName("Should validate nom is required")
    void shouldValidateNomIsRequired() {
        // Given
        RegisterRequest registerRequest = new RegisterRequest("", "test@example.com", "password123");

        // When
        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(registerRequest);

        // Then
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage()).contains("Le nom est requis");
    }

    @Test
    @DisplayName("Should validate nom maximum length")
    void shouldValidateNomMaximumLength() {
        // Given
        String longName = "a".repeat(51); // 51 characters
        RegisterRequest registerRequest = new RegisterRequest(longName, "test@example.com", "password123");

        // When
        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(registerRequest);

        // Then
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage()).contains("Le nom ne peut pas dépasser 50 caractères");
    }

    @Test
    @DisplayName("Should validate email is required")
    void shouldValidateEmailIsRequired() {
        // Given
        RegisterRequest registerRequest = new RegisterRequest("Test User", "", "password123");

        // When
        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(registerRequest);

        // Then
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage()).contains("Email é obrigatório");
    }

    @Test
    @DisplayName("Should validate email format")
    void shouldValidateEmailFormat() {
        // Given
        RegisterRequest registerRequest = new RegisterRequest("Test User", "invalid-email", "password123");

        // When
        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(registerRequest);

        // Then
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage()).contains("Email inválido");
    }

    @Test
    @DisplayName("Should validate password is required")
    void shouldValidatePasswordIsRequired() {
        // Given
        RegisterRequest registerRequest = new RegisterRequest("Test User", "test@example.com", "");

        // When
        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(registerRequest);

        // Then
        assertThat(violations).hasSize(2); // Both @NotBlank and @Size will trigger
        assertThat(violations.stream().anyMatch(v -> v.getMessage().contains("Le mot de passe est requis"))).isTrue();
        assertThat(violations.stream().anyMatch(v -> v.getMessage().contains("Le mot de passe doit contenir au moins 6 caractères"))).isTrue();
    }

    @Test
    @DisplayName("Should validate password minimum length")
    void shouldValidatePasswordMinimumLength() {
        // Given
        RegisterRequest registerRequest = new RegisterRequest("Test User", "test@example.com", "123");

        // When
        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(registerRequest);

        // Then
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage()).contains("Le mot de passe doit contenir au moins 6 caractères");
    }

    @Test
    @DisplayName("Should validate null nom")
    void shouldValidateNullNom() {
        // Given
        RegisterRequest registerRequest = new RegisterRequest(null, "test@example.com", "password123");

        // When
        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(registerRequest);

        // Then
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage()).contains("Le nom est requis");
    }

    @Test
    @DisplayName("Should validate null email")
    void shouldValidateNullEmail() {
        // Given
        RegisterRequest registerRequest = new RegisterRequest("Test User", null, "password123");

        // When
        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(registerRequest);

        // Then
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage()).contains("Email é obrigatório");
    }

    @Test
    @DisplayName("Should validate null password")
    void shouldValidateNullPassword() {
        // Given
        RegisterRequest registerRequest = new RegisterRequest("Test User", "test@example.com", null);

        // When
        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(registerRequest);

        // Then
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage()).contains("Le mot de passe est requis");
    }

    @Test
    @DisplayName("Should create RegisterRequest with default constructor")
    void shouldCreateRegisterRequestWithDefaultConstructor() {
        // Given
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setNom("Test User");
        registerRequest.setEmail("test@example.com");
        registerRequest.setMotDePasse("password123");

        // When
        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(registerRequest);

        // Then
        assertThat(violations).isEmpty();
        assertThat(registerRequest.getNom()).isEqualTo("Test User");
        assertThat(registerRequest.getEmail()).isEqualTo("test@example.com");
        assertThat(registerRequest.getMotDePasse()).isEqualTo("password123");
    }

    @Test
    @DisplayName("Should handle multiple validation errors")
    void shouldHandleMultipleValidationErrors() {
        // Given
        RegisterRequest registerRequest = new RegisterRequest("", "invalid-email", "123");

        // When
        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(registerRequest);

        // Then
        assertThat(violations).hasSize(3);
        assertThat(violations.stream().anyMatch(v -> v.getMessage().contains("Le nom est requis"))).isTrue();
        assertThat(violations.stream().anyMatch(v -> v.getMessage().contains("Email inválido"))).isTrue();
        assertThat(violations.stream().anyMatch(v -> v.getMessage().contains("Le mot de passe doit contenir au moins 6 caractères"))).isTrue();
    }

    @Test
    @DisplayName("Should accept nom with exactly 50 characters")
    void shouldAcceptNomWithExactly50Characters() {
        // Given
        String exactName = "a".repeat(50); // Exactly 50 characters
        RegisterRequest registerRequest = new RegisterRequest(exactName, "test@example.com", "password123");

        // When
        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(registerRequest);

        // Then
        assertThat(violations).isEmpty();
        assertThat(registerRequest.getNom()).isEqualTo(exactName);
    }

    @Test
    @DisplayName("Should accept password with exactly 6 characters")
    void shouldAcceptPasswordWithExactly6Characters() {
        // Given
        RegisterRequest registerRequest = new RegisterRequest("Test User", "test@example.com", "123456");

        // When
        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(registerRequest);

        // Then
        assertThat(violations).isEmpty();
        assertThat(registerRequest.getMotDePasse()).isEqualTo("123456");
    }
}