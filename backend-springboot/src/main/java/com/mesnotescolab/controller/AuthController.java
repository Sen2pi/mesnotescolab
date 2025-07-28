package com.mesnotescolab.controller;

import com.mesnotescolab.dto.*;
import com.mesnotescolab.entity.User;
import com.mesnotescolab.service.JwtService;
import com.mesnotescolab.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentification", description = "API d'authentification et gestion des utilisateurs")
@CrossOrigin(origins = "${cors.allowed-origins}")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserService userService;

    @Autowired
    private JwtService jwtService;

    @PostMapping("/register")
    @Operation(summary = "Inscription d'un nouvel utilisateur")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request, BindingResult bindingResult) {
        try {
            if (bindingResult.hasErrors()) {
                List<String> errors = bindingResult.getFieldErrors().stream()
                        .map(error -> error.getDefaultMessage())
                        .collect(Collectors.toList());
                return ResponseEntity.badRequest().body(ApiResponse.error("Données invalides.", errors));
            }

            User user = userService.createUser(request.getNom(), request.getEmail(), request.getMotDePasse());
            String token = jwtService.generateToken(user);

            // Send welcome email asynchronously (don't block if email fails)
            try {
                // emailService.sendWelcomeEmail(user.getEmail(), user.getNom());
            } catch (Exception e) {
                logger.warn("Failed to send welcome email: {}", e.getMessage());
            }

            AuthResponse authResponse = new AuthResponse(user, token);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Compte créé avec succès !", authResponse));

        } catch (RuntimeException e) {
            logger.error("Erreur inscription: {}", e.getMessage());
            if (e.getMessage().contains("existe déjà")) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(ApiResponse.error(e.getMessage()));
            }
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Erreur inscription:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Erreur interne du serveur."));
        }
    }

    @PostMapping("/login")
    @Operation(summary = "Connexion utilisateur")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody AuthRequest request, BindingResult bindingResult) {
        try {
            if (bindingResult.hasErrors()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Email et mot de passe requis."));
            }

            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getMotDePasse())
            );

            User user = (User) authentication.getPrincipal();
            String token = jwtService.generateToken(user);

            // Update last login asynchronously
            userService.updateLastLogin(user);

            AuthResponse authResponse = new AuthResponse(user, token);
            return ResponseEntity.ok(ApiResponse.success("Connexion réussie !", authResponse));

        } catch (Exception e) {
            logger.error("Erreur connexion: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Identifiants incorrects."));
        }
    }

    @GetMapping("/me")
    @Operation(summary = "Obtenir les informations de l'utilisateur connecté")
    public ResponseEntity<ApiResponse<User>> getCurrentUser(@AuthenticationPrincipal User user) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Informations utilisateur", user));
        } catch (Exception e) {
            logger.error("Erreur récupération profil:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Erreur interne du serveur."));
        }
    }

    @PutMapping("/profile")
    @Operation(summary = "Mettre à jour le profil utilisateur")
    public ResponseEntity<ApiResponse<User>> updateProfile(
            @AuthenticationPrincipal User currentUser,
            @RequestBody UpdateProfileRequest request) {
        try {
            User updatedUser = userService.updateProfile(currentUser, request.getNom(), request.getAvatar());
            return ResponseEntity.ok(ApiResponse.success("Profil mis à jour avec succès !", updatedUser));

        } catch (Exception e) {
            logger.error("Erreur mise à jour profil:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Erreur interne du serveur."));
        }
    }

    @PutMapping("/change-password")
    @Operation(summary = "Changer le mot de passe")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody ChangePasswordRequest request,
            BindingResult bindingResult) {
        try {
            if (bindingResult.hasErrors()) {
                List<String> errors = bindingResult.getFieldErrors().stream()
                        .map(error -> error.getDefaultMessage())
                        .collect(Collectors.toList());
                return ResponseEntity.badRequest().body(ApiResponse.error("Données invalides.", errors));
            }

            userService.changePassword(currentUser, request.getAncienMotDePasse(), request.getNouveauMotDePasse());
            return ResponseEntity.ok(ApiResponse.success("Mot de passe changé avec succès !"));

        } catch (RuntimeException e) {
            logger.error("Erreur changement mot de passe: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Erreur changement mot de passe:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Erreur interne du serveur."));
        }
    }
}