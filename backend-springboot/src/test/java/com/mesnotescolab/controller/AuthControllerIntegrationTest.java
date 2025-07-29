package com.mesnotescolab.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mesnotescolab.dto.AuthRequest;
import com.mesnotescolab.dto.ChangePasswordRequest;
import com.mesnotescolab.dto.RegisterRequest;
import com.mesnotescolab.dto.UpdateProfileRequest;
import com.mesnotescolab.entity.User;
import com.mesnotescolab.service.JwtService;
import com.mesnotescolab.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureWebMvc
@ActiveProfiles("test")
@DisplayName("AuthController Integration Tests")
class AuthControllerIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private AuthenticationManager authenticationManager;

    @MockBean
    private PasswordEncoder passwordEncoder;

    private MockMvc mockMvc;
    private User testUser;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        testUser = new User();
        testUser.setId(1L);
        testUser.setNom("Test User");
        testUser.setEmail("test@example.com");
        testUser.setMotDePasse("hashedPassword");
    }

    @Test
    @DisplayName("Should register user successfully")
    void shouldRegisterUserSuccessfully() throws Exception {
        // Given
        RegisterRequest request = new RegisterRequest("Test User", "test@example.com", "password123");
        String token = "jwt-token";

        when(userService.createUser(anyString(), anyString(), anyString())).thenReturn(testUser);
        when(jwtService.generateToken(any(User.class))).thenReturn(token);

        // When & Then
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Utilisateur créé avec succès !"))
                .andExpect(jsonPath("$.data.user.email").value(testUser.getEmail()))
                .andExpected(jsonPath("$.data.token").value(token));

        verify(userService).createUser("Test User", "test@example.com", "password123");
        verify(jwtService).generateToken(testUser);
    }

    @Test
    @DisplayName("Should reject registration with invalid data")
    void shouldRejectRegistrationWithInvalidData() throws Exception {
        // Given
        RegisterRequest request = new RegisterRequest("", "invalid-email", "123"); // Invalid data

        // When & Then
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Données invalides."));

        verify(userService, never()).createUser(anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("Should login user successfully")
    void shouldLoginUserSuccessfully() throws Exception {
        // Given
        AuthRequest request = new AuthRequest("test@example.com", "password123");
        String token = "jwt-token";
        Authentication authentication = mock(Authentication.class);

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(authentication.getPrincipal()).thenReturn(testUser);
        when(jwtService.generateToken(any(User.class))).thenReturn(token);

        // When & Then
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Connexion réussie !"))
                .andExpect(jsonPath("$.data.user.email").value(testUser.getEmail()))
                .andExpect(jsonPath("$.data.token").value(token));

        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(jwtService).generateToken(testUser);
        verify(userService).updateLastLogin(testUser);
    }

    @Test
    @DisplayName("Should reject login with invalid credentials")
    void shouldRejectLoginWithInvalidCredentials() throws Exception {
        // Given
        AuthRequest request = new AuthRequest("test@example.com", "wrongpassword");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new RuntimeException("Bad credentials"));

        // When & Then
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Email ou mot de passe incorrect."));

        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(jwtService, never()).generateToken(any());
    }

    @Test
    @DisplayName("Should update profile successfully")
    void shouldUpdateProfileSuccessfully() throws Exception {
        // Given
        UpdateProfileRequest request = new UpdateProfileRequest("Updated Name", "updated-avatar.jpg");
        User updatedUser = new User();
        updatedUser.setId(1L);
        updatedUser.setNom("Updated Name");
        updatedUser.setEmail(testUser.getEmail());

        when(userService.updateProfile(any(User.class), anyString(), anyString())).thenReturn(updatedUser);

        // When & Then
        mockMvc.perform(put("/api/auth/profile")
                .with(user(testUser))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Profil mis à jour avec succès !"))
                .andExpect(jsonPath("$.data.nom").value("Updated Name"));

        verify(userService).updateProfile(testUser, "Updated Name", "updated-avatar.jpg");
    }

    @Test
    @DisplayName("Should require authentication for profile update")
    void shouldRequireAuthenticationForProfileUpdate() throws Exception {
        // Given
        UpdateProfileRequest request = new UpdateProfileRequest("Updated Name", "updated-avatar.jpg");

        // When & Then
        mockMvc.perform(put("/api/auth/profile")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());

        verify(userService, never()).updateProfile(any(), anyString(), anyString());
    }

    @Test
    @DisplayName("Should change password successfully")
    void shouldChangePasswordSuccessfully() throws Exception {
        // Given
        ChangePasswordRequest request = new ChangePasswordRequest("oldPassword", "newPassword123");

        doNothing().when(userService).changePassword(any(User.class), anyString(), anyString());

        // When & Then
        mockMvc.perform(put("/api/auth/change-password")
                .with(user(testUser))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Mot de passe changé avec succès !"));

        verify(userService).changePassword(testUser, "oldPassword", "newPassword123");
    }

    @Test
    @DisplayName("Should reject password change with invalid old password")
    void shouldRejectPasswordChangeWithInvalidOldPassword() throws Exception {
        // Given
        ChangePasswordRequest request = new ChangePasswordRequest("wrongOldPassword", "newPassword123");

        doThrow(new RuntimeException("Mot de passe actuel incorrect"))
                .when(userService).changePassword(any(User.class), anyString(), anyString());

        // When & Then
        mockMvc.perform(put("/api/auth/change-password")
                .with(user(testUser))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Mot de passe actuel incorrect"));

        verify(userService).changePassword(testUser, "wrongOldPassword", "newPassword123");
    }

    @Test
    @DisplayName("Should reject password change with invalid data")
    void shouldRejectPasswordChangeWithInvalidData() throws Exception {
        // Given
        ChangePasswordRequest request = new ChangePasswordRequest("", "123"); // Invalid data

        // When & Then
        mockMvc.perform(put("/api/auth/change-password")
                .with(user(testUser))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Données invalides."));

        verify(userService, never()).changePassword(any(), anyString(), anyString());
    }

    @Test
    @DisplayName("Should get current user profile")
    void shouldGetCurrentUserProfile() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/auth/me")
                .with(user(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value(testUser.getEmail()))
                .andExpect(jsonPath("$.data.nom").value(testUser.getNom()));
    }

    @Test
    @DisplayName("Should require authentication for current user profile")
    void shouldRequireAuthenticationForCurrentUserProfile() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Should handle service exceptions gracefully")
    void shouldHandleServiceExceptionsGracefully() throws Exception {
        // Given
        RegisterRequest request = new RegisterRequest("Test User", "test@example.com", "password123");

        when(userService.createUser(anyString(), anyString(), anyString()))
                .thenThrow(new RuntimeException("Email already exists"));

        // When & Then
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Email already exists"));

        verify(userService).createUser("Test User", "test@example.com", "password123");
    }
}