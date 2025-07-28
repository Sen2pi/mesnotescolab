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

@DisplayName("AuthRequest DTO Tests")
class AuthRequestTest {

    private Validator validator;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    @DisplayName("Should create valid AuthRequest")
    void shouldCreateValidAuthRequest() {
        // Given
        AuthRequest authRequest = new AuthRequest("test@example.com", "password123");

        // When
        Set<ConstraintViolation<AuthRequest>> violations = validator.validate(authRequest);

        // Then
        assertThat(violations).isEmpty();
        assertThat(authRequest.getEmail()).isEqualTo("test@example.com");
        assertThat(authRequest.getMotDePasse()).isEqualTo("password123");
    }

    @Test
    @DisplayName("Should validate email is required")
    void shouldValidateEmailIsRequired() {
        // Given
        AuthRequest authRequest = new AuthRequest("", "password123");

        // When
        Set<ConstraintViolation<AuthRequest>> violations = validator.validate(authRequest);

        // Then
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage()).contains("Email é obrigatório");
    }

    @Test
    @DisplayName("Should validate email format")
    void shouldValidateEmailFormat() {
        // Given
        AuthRequest authRequest = new AuthRequest("invalid-email", "password123");

        // When
        Set<ConstraintViolation<AuthRequest>> violations = validator.validate(authRequest);

        // Then
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage()).contains("Email inválido");
    }

    @Test
    @DisplayName("Should validate password is required")
    void shouldValidatePasswordIsRequired() {
        // Given
        AuthRequest authRequest = new AuthRequest("test@example.com", "");

        // When
        Set<ConstraintViolation<AuthRequest>> violations = validator.validate(authRequest);

        // Then
        assertThat(violations).hasSize(2); // Both @NotBlank and @Size will trigger
        assertThat(violations.stream().anyMatch(v -> v.getMessage().contains("Le mot de passe est requis"))).isTrue();
        assertThat(violations.stream().anyMatch(v -> v.getMessage().contains("Le mot de passe doit contenir au moins 6 caractères"))).isTrue();
    }

    @Test
    @DisplayName("Should validate password minimum length")
    void shouldValidatePasswordMinimumLength() {
        // Given
        AuthRequest authRequest = new AuthRequest("test@example.com", "123");

        // When
        Set<ConstraintViolation<AuthRequest>> violations = validator.validate(authRequest);

        // Then
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage()).contains("Le mot de passe doit contenir au moins 6 caractères");
    }

    @Test
    @DisplayName("Should validate null email")
    void shouldValidateNullEmail() {
        // Given
        AuthRequest authRequest = new AuthRequest(null, "password123");

        // When
        Set<ConstraintViolation<AuthRequest>> violations = validator.validate(authRequest);

        // Then
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage()).contains("Email é obrigatório");
    }

    @Test
    @DisplayName("Should validate null password")
    void shouldValidateNullPassword() {
        // Given
        AuthRequest authRequest = new AuthRequest("test@example.com", null);

        // When
        Set<ConstraintViolation<AuthRequest>> violations = validator.validate(authRequest);

        // Then
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage()).contains("Le mot de passe est requis");
    }

    @Test
    @DisplayName("Should create AuthRequest with default constructor")
    void shouldCreateAuthRequestWithDefaultConstructor() {
        // Given
        AuthRequest authRequest = new AuthRequest();
        authRequest.setEmail("test@example.com");
        authRequest.setMotDePasse("password123");

        // When
        Set<ConstraintViolation<AuthRequest>> violations = validator.validate(authRequest);

        // Then
        assertThat(violations).isEmpty();
        assertThat(authRequest.getEmail()).isEqualTo("test@example.com");
        assertThat(authRequest.getMotDePasse()).isEqualTo("password123");
    }

    @Test
    @DisplayName("Should handle multiple validation errors")
    void shouldHandleMultipleValidationErrors() {
        // Given
        AuthRequest authRequest = new AuthRequest("", "123");

        // When
        Set<ConstraintViolation<AuthRequest>> violations = validator.validate(authRequest);

        // Then
        assertThat(violations).hasSize(2);
        assertThat(violations.stream().anyMatch(v -> v.getMessage().contains("Email é obrigatório"))).isTrue();
        assertThat(violations.stream().anyMatch(v -> v.getMessage().contains("Le mot de passe doit contenir au moins 6 caractères"))).isTrue();
    }
}