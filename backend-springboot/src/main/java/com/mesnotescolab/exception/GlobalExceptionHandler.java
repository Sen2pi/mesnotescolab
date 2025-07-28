package com.mesnotescolab.exception;

import com.mesnotescolab.dto.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Object>> handleValidationExceptions(
            MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        return ResponseEntity.badRequest()
                .body(ApiResponse.error("Données de validation invalides", errors));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Object>> handleBadCredentials(BadCredentialsException ex) {
        logger.warn("Tentative de connexion avec des identifiants incorrects");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("Identifiants incorrects"));
    }

    @ExceptionHandler(UsernameNotFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleUserNotFound(UsernameNotFoundException ex) {
        logger.warn("Utilisateur non trouvé: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("Identifiants incorrects"));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiResponse<Object>> handleRuntimeException(RuntimeException ex) {
        logger.error("Erreur runtime: {}", ex.getMessage(), ex);
        
        String message = ex.getMessage();
        
        // Handle specific runtime exceptions
        if (message != null && message.contains("existe déjà")) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error(message));
        }
        
        if (message != null && (message.contains("incorrect") || message.contains("non trouvé"))) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(message));
        }
        
        return ResponseEntity.badRequest()
                .body(ApiResponse.error(message));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleGenericException(Exception ex) {
        logger.error("Erreur interne: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Erreur interne du serveur"));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Object>> handleIllegalArgument(IllegalArgumentException ex) {
        logger.warn("Argument invalide: {}", ex.getMessage());
        return ResponseEntity.badRequest()
                .body(ApiResponse.error("Paramètre invalide: " + ex.getMessage()));
    }

    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<ApiResponse<Object>> handleSecurityException(SecurityException ex) {
        logger.warn("Erreur de sécurité: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("Accès refusé"));
    }
}