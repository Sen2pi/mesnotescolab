package com.mesnotescolab.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mesnotescolab.config.TestConfig;
import com.mesnotescolab.dto.AuthRequest;
import com.mesnotescolab.dto.ChangePasswordRequest;
import com.mesnotescolab.dto.RegisterRequest;
import com.mesnotescolab.dto.UpdateProfileRequest;
import com.mesnotescolab.entity.User;
import com.mesnotescolab.service.JwtService;
import com.mesnotescolab.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@Import(TestConfig.class)
@DisplayName("AuthController Unit Tests")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthenticationManager authenticationManager;

    @MockBean
    private UserService userService;

    @MockBean
    private JwtService jwtService;

    private User testUser;
    private RegisterRequest registerRequest;
    private AuthRequest authRequest;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setNom("Test User");
        testUser.setEmail("test@example.com");
        testUser.setMotDePasse("encodedPassword");
        testUser.setIsActive(true);

        registerRequest = new RegisterRequest("Test User", "test@example.com", "password123");
        authRequest = new AuthRequest("test@example.com", "password123");
    }

    @Test
    @DisplayName("Should register user successfully")
    void shouldRegisterUserSuccessfully() throws Exception {
        // Given
        when(userService.createUser("Test User", "test@example.com", "password123")).thenReturn(testUser);
        when(jwtService.generateToken(testUser)).thenReturn("jwt-token");

        // When & Then
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Compte créé avec succès !"))
                .andExpect(jsonPath("$.data.user.id").value(1))
                .andExpect(jsonPath("$.data.user.nom").value("Test User"))
                .andExpect(jsonPath("$.data.user.email").value("test@example.com"))
                .andExpect(jsonPath("$.data.token").value("jwt-token"));

        verify(userService).createUser("Test User", "test@example.com", "password123");
        verify(jwtService).generateToken(testUser);
    }

    @Test
    @DisplayName("Should return validation error for invalid register request")
    void shouldReturnValidationErrorForInvalidRegisterRequest() throws Exception {
        // Given
        RegisterRequest invalidRequest = new RegisterRequest("", "invalid-email", "123");

        // When & Then
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Données invalides."));

        verify(userService, never()).createUser(anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("Should return conflict when user already exists")
    void shouldReturnConflictWhenUserAlreadyExists() throws Exception {
        // Given
        when(userService.createUser("Test User", "test@example.com", "password123"))
                .thenThrow(new RuntimeException("Un compte avec cet email existe déjà."));

        // When & Then
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Un compte avec cet email existe déjà."));

        verify(userService).createUser("Test User", "test@example.com", "password123");
    }

    @Test
    @DisplayName("Should login user successfully")
    void shouldLoginUserSuccessfully() throws Exception {
        // Given
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(testUser);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(jwtService.generateToken(testUser)).thenReturn("jwt-token");
        when(userService.updateLastLogin(testUser)).thenReturn(testUser);

        // When & Then
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(authRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Connexion réussie !"))
                .andExpect(jsonPath("$.data.user.id").value(1))
                .andExpect(jsonPath("$.data.token").value("jwt-token"));

        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(jwtService).generateToken(testUser);
        verify(userService).updateLastLogin(testUser);
    }

    @Test
    @DisplayName("Should return unauthorized for invalid credentials")
    void shouldReturnUnauthorizedForInvalidCredentials() throws Exception {
        // Given
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        // When & Then
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(authRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Identifiants incorrects."));

        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(jwtService, never()).generateToken(any(User.class));
    }

    @Test
    @DisplayName("Should return validation error for invalid login request")
    void shouldReturnValidationErrorForInvalidLoginRequest() throws Exception {
        // Given
        AuthRequest invalidRequest = new AuthRequest("", "");

        // When & Then
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Email et mot de passe requis."));

        verify(authenticationManager, never()).authenticate(any());
    }

    @Test
    @DisplayName("Should get current user successfully")
    @WithMockUser
    void shouldGetCurrentUserSuccessfully() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/auth/me")
                .with(user(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Informations utilisateur"))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.nom").value("Test User"));
    }

    @Test
    @DisplayName("Should update profile successfully")
    @WithMockUser
    void shouldUpdateProfileSuccessfully() throws Exception {
        // Given
        UpdateProfileRequest updateRequest = new UpdateProfileRequest();
        updateRequest.setNom("Updated User");
        updateRequest.setAvatar("new-avatar");

        User updatedUser = new User();
        updatedUser.setId(1L);
        updatedUser.setNom("Updated User");
        updatedUser.setEmail("test@example.com");
        updatedUser.setAvatar("new-avatar");

        when(userService.updateProfile(any(User.class), eq("Updated User"), eq("new-avatar")))
                .thenReturn(updatedUser);

        // When & Then
        mockMvc.perform(put("/api/auth/profile")
                .with(user(testUser))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Profil mis à jour avec succès !"))
                .andExpect(jsonPath("$.data.nom").value("Updated User"))
                .andExpect(jsonPath("$.data.avatar").value("new-avatar"));

        verify(userService).updateProfile(any(User.class), eq("Updated User"), eq("new-avatar"));
    }

    @Test
    @DisplayName("Should change password successfully")
    @WithMockUser
    void shouldChangePasswordSuccessfully() throws Exception {
        // Given
        ChangePasswordRequest changePasswordRequest = new ChangePasswordRequest();
        changePasswordRequest.setAncienMotDePasse("oldPassword");
        changePasswordRequest.setNouveauMotDePasse("newPassword");

        when(userService.changePassword(any(User.class), eq("oldPassword"), eq("newPassword")))
                .thenReturn(testUser);

        // When & Then
        mockMvc.perform(put("/api/auth/change-password")
                .with(user(testUser))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(changePasswordRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Mot de passe changé avec succès !"));

        verify(userService).changePassword(any(User.class), eq("oldPassword"), eq("newPassword"));
    }

    @Test
    @DisplayName("Should return unauthorized for incorrect old password")
    @WithMockUser
    void shouldReturnUnauthorizedForIncorrectOldPassword() throws Exception {
        // Given
        ChangePasswordRequest changePasswordRequest = new ChangePasswordRequest();
        changePasswordRequest.setAncienMotDePasse("wrongPassword");
        changePasswordRequest.setNouveauMotDePasse("newPassword");

        when(userService.changePassword(any(User.class), eq("wrongPassword"), eq("newPassword")))
                .thenThrow(new RuntimeException("Ancien mot de passe incorrect."));

        // When & Then
        mockMvc.perform(put("/api/auth/change-password")
                .with(user(testUser))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(changePasswordRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Ancien mot de passe incorrect."));

        verify(userService).changePassword(any(User.class), eq("wrongPassword"), eq("newPassword"));
    }

    @Test
    @DisplayName("Should return validation error for invalid change password request")
    @WithMockUser
    void shouldReturnValidationErrorForInvalidChangePasswordRequest() throws Exception {
        // Given
        ChangePasswordRequest invalidRequest = new ChangePasswordRequest();
        invalidRequest.setAncienMotDePasse("");
        invalidRequest.setNouveauMotDePasse("123");

        // When & Then
        mockMvc.perform(put("/api/auth/change-password")
                .with(user(testUser))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Données invalides."));

        verify(userService, never()).changePassword(any(), anyString(), anyString());
    }
}