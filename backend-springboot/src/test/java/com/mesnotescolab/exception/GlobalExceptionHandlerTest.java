package com.mesnotescolab.exception;

import com.mesnotescolab.dto.ApiResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@DisplayName("GlobalExceptionHandler Tests")
class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler exceptionHandler;

    @BeforeEach
    void setUp() {
        exceptionHandler = new GlobalExceptionHandler();
    }

    @Test
    @DisplayName("Should handle MethodArgumentNotValidException")
    void shouldHandleMethodArgumentNotValidException() {
        // Given
        MethodArgumentNotValidException exception = mock(MethodArgumentNotValidException.class);
        BindingResult bindingResult = mock(BindingResult.class);
        FieldError fieldError1 = new FieldError("user", "email", "Email is required");
        FieldError fieldError2 = new FieldError("user", "password", "Password is too short");
        
        when(exception.getBindingResult()).thenReturn(bindingResult);
        when(bindingResult.getAllErrors()).thenReturn(List.of(fieldError1, fieldError2));

        // When
        ResponseEntity<ApiResponse<Object>> response = exceptionHandler.handleValidationExceptions(exception);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getMessage()).isEqualTo("Données de validation invalides");
        
        @SuppressWarnings("unchecked")
        Map<String, String> errors = (Map<String, String>) response.getBody().getErrors();
        assertThat(errors).containsEntry("email", "Email is required");
        assertThat(errors).containsEntry("password", "Password is too short");
    }

    @Test
    @DisplayName("Should handle BadCredentialsException")
    void shouldHandleBadCredentialsException() {
        // Given
        BadCredentialsException exception = new BadCredentialsException("Bad credentials");

        // When
        ResponseEntity<ApiResponse<Object>> response = exceptionHandler.handleBadCredentials(exception);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getMessage()).isEqualTo("Identifiants incorrects");
    }

    @Test
    @DisplayName("Should handle UsernameNotFoundException")
    void shouldHandleUsernameNotFoundException() {
        // Given
        UsernameNotFoundException exception = new UsernameNotFoundException("User not found: test@example.com");

        // When
        ResponseEntity<ApiResponse<Object>> response = exceptionHandler.handleUserNotFound(exception);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getMessage()).isEqualTo("Identifiants incorrects");
    }

    @Test
    @DisplayName("Should handle RuntimeException with 'existe déjà' message")
    void shouldHandleRuntimeExceptionWithExisteDejaMessage() {
        // Given
        RuntimeException exception = new RuntimeException("Un compte avec cet email existe déjà");

        // When
        ResponseEntity<ApiResponse<Object>> response = exceptionHandler.handleRuntimeException(exception);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getMessage()).isEqualTo("Un compte avec cet email existe déjà");
    }

    @Test
    @DisplayName("Should handle RuntimeException with 'incorrect' message")
    void shouldHandleRuntimeExceptionWithIncorrectMessage() {
        // Given
        RuntimeException exception = new RuntimeException("Mot de passe incorrect");

        // When
        ResponseEntity<ApiResponse<Object>> response = exceptionHandler.handleRuntimeException(exception);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getMessage()).isEqualTo("Mot de passe incorrect");
    }

    @Test
    @DisplayName("Should handle RuntimeException with 'non trouvé' message")
    void shouldHandleRuntimeExceptionWithNonTrouveMessage() {
        // Given
        RuntimeException exception = new RuntimeException("Utilisateur non trouvé");

        // When
        ResponseEntity<ApiResponse<Object>> response = exceptionHandler.handleRuntimeException(exception);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getMessage()).isEqualTo("Utilisateur non trouvé");
    }

    @Test
    @DisplayName("Should handle generic RuntimeException")
    void shouldHandleGenericRuntimeException() {
        // Given
        RuntimeException exception = new RuntimeException("Generic runtime error");

        // When
        ResponseEntity<ApiResponse<Object>> response = exceptionHandler.handleRuntimeException(exception);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getMessage()).isEqualTo("Generic runtime error");
    }

    @Test
    @DisplayName("Should handle generic Exception")
    void shouldHandleGenericException() {
        // Given
        Exception exception = new Exception("Internal server error");

        // When
        ResponseEntity<ApiResponse<Object>> response = exceptionHandler.handleGenericException(exception);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getMessage()).isEqualTo("Erreur interne du serveur");
    }

    @Test
    @DisplayName("Should handle IllegalArgumentException")
    void shouldHandleIllegalArgumentException() {
        // Given
        IllegalArgumentException exception = new IllegalArgumentException("Invalid parameter value");

        // When
        ResponseEntity<ApiResponse<Object>> response = exceptionHandler.handleIllegalArgument(exception);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getMessage()).isEqualTo("Paramètre invalide: Invalid parameter value");
    }

    @Test
    @DisplayName("Should handle SecurityException")
    void shouldHandleSecurityException() {
        // Given
        SecurityException exception = new SecurityException("Access denied");

        // When
        ResponseEntity<ApiResponse<Object>> response = exceptionHandler.handleSecurityException(exception);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getMessage()).isEqualTo("Accès refusé");
    }

    @Test
    @DisplayName("Should handle RuntimeException with null message")
    void shouldHandleRuntimeExceptionWithNullMessage() {
        // Given
        RuntimeException exception = new RuntimeException((String) null);

        // When
        ResponseEntity<ApiResponse<Object>> response = exceptionHandler.handleRuntimeException(exception);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getMessage()).isNull();
    }

    @Test
    @DisplayName("Should handle Exception with empty message")
    void shouldHandleExceptionWithEmptyMessage() {
        // Given
        Exception exception = new Exception("");

        // When
        ResponseEntity<ApiResponse<Object>> response = exceptionHandler.handleGenericException(exception);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getMessage()).isEqualTo("Erreur interne du serveur");
    }

    @Test
    @DisplayName("Should prioritize specific RuntimeException handling over generic")
    void shouldPrioritizeSpecificRuntimeExceptionHandlingOverGeneric() {
        // Test that specific patterns are caught correctly
        
        // Test "existe déjà" pattern
        RuntimeException existsException = new RuntimeException("Un utilisateur avec cet email existe déjà");
        ResponseEntity<ApiResponse<Object>> existsResponse = exceptionHandler.handleRuntimeException(existsException);
        assertThat(existsResponse.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);

        // Test "incorrect" pattern
        RuntimeException incorrectException = new RuntimeException("Ancien mot de passe incorrect");
        ResponseEntity<ApiResponse<Object>> incorrectResponse = exceptionHandler.handleRuntimeException(incorrectException);
        assertThat(incorrectResponse.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);

        // Test "non trouvé" pattern
        RuntimeException notFoundException = new RuntimeException("Ressource non trouvé");
        ResponseEntity<ApiResponse<Object>> notFoundResponse = exceptionHandler.handleRuntimeException(notFoundException);
        assertThat(notFoundResponse.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);

        // Test generic case
        RuntimeException genericException = new RuntimeException("Some other error");
        ResponseEntity<ApiResponse<Object>> genericResponse = exceptionHandler.handleRuntimeException(genericException);
        assertThat(genericResponse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }
}