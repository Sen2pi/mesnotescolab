package com.mesnotescolab.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mesnotescolab.config.TestConfig;
import com.mesnotescolab.dto.AuthRequest;
import com.mesnotescolab.dto.RegisterRequest;
import com.mesnotescolab.entity.User;
import com.mesnotescolab.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureWebMvc
@Import(TestConfig.class)
@ActiveProfiles("test")
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:testdb",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
@Transactional
@DisplayName("AuthController Integration Tests")
class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private RegisterRequest registerRequest;
    private AuthRequest authRequest;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        
        registerRequest = new RegisterRequest("Integration Test User", "integration@example.com", "password123");
        authRequest = new AuthRequest("integration@example.com", "password123");
    }

    @Test
    @DisplayName("Should register user and save to database")
    void shouldRegisterUserAndSaveToDatabase() throws Exception {
        // When
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Compte créé avec succès !"))
                .andExpect(jsonPath("$.data.user.nom").value("Integration Test User"))
                .andExpect(jsonPath("$.data.user.email").value("integration@example.com"))
                .andExpect(jsonPath("$.data.token").exists());

        // Then - verify user was saved to database
        assertThat(userRepository.count()).isEqualTo(1);
        User savedUser = userRepository.findByEmail("integration@example.com").orElse(null);
        assertThat(savedUser).isNotNull();
        assertThat(savedUser.getNom()).isEqualTo("Integration Test User");
        assertThat(savedUser.getEmail()).isEqualTo("integration@example.com");
        assertThat(savedUser.getIsActive()).isTrue();
        assertThat(passwordEncoder.matches("password123", savedUser.getMotDePasse())).isTrue();
    }

    @Test
    @DisplayName("Should prevent duplicate user registration")
    void shouldPreventDuplicateUserRegistration() throws Exception {
        // Given - register user first time
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated());

        // When - try to register same user again
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Un compte avec cet email existe déjà."));

        // Then - verify only one user in database
        assertThat(userRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("Should login user with correct credentials")
    void shouldLoginUserWithCorrectCredentials() throws Exception {
        // Given - create user first
        User user = new User();
        user.setNom("Test User");
        user.setEmail("test@example.com");
        user.setMotDePasse(passwordEncoder.encode("password123"));
        user.setIsActive(true);
        userRepository.save(user);

        AuthRequest loginRequest = new AuthRequest("test@example.com", "password123");

        // When
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Connexion réussie !"))
                .andExpect(jsonPath("$.data.user.email").value("test@example.com"))
                .andExpect(jsonPath("$.data.token").exists());

        // Then - verify last login was updated
        User updatedUser = userRepository.findByEmail("test@example.com").orElse(null);
        assertThat(updatedUser).isNotNull();
        assertThat(updatedUser.getDerniereConnexion()).isNotNull();
    }

    @Test
    @DisplayName("Should reject login with incorrect credentials")
    void shouldRejectLoginWithIncorrectCredentials() throws Exception {
        // Given - create user first
        User user = new User();
        user.setNom("Test User");
        user.setEmail("test@example.com");
        user.setMotDePasse(passwordEncoder.encode("password123"));
        user.setIsActive(true);
        userRepository.save(user);

        AuthRequest loginRequest = new AuthRequest("test@example.com", "wrongpassword");

        // When
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Identifiants incorrects."));
    }

    @Test
    @DisplayName("Should reject login for inactive user")
    void shouldRejectLoginForInactiveUser() throws Exception {
        // Given - create inactive user
        User user = new User();
        user.setNom("Inactive User");
        user.setEmail("inactive@example.com");
        user.setMotDePasse(passwordEncoder.encode("password123"));
        user.setIsActive(false);
        userRepository.save(user);

        AuthRequest loginRequest = new AuthRequest("inactive@example.com", "password123");

        // When
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Identifiants incorrects."));
    }

    @Test
    @DisplayName("Should reject login for non-existent user")
    void shouldRejectLoginForNonExistentUser() throws Exception {
        // Given
        AuthRequest loginRequest = new AuthRequest("nonexistent@example.com", "password123");

        // When
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Identifiants incorrects."));
    }

    @Test
    @DisplayName("Should validate registration request fields")
    void shouldValidateRegistrationRequestFields() throws Exception {
        // Given
        RegisterRequest invalidRequest = new RegisterRequest("", "invalid-email", "123");

        // When
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Données invalides."))
                .andExpect(jsonPath("$.errors").isArray());

        // Then - verify no user was created
        assertThat(userRepository.count()).isZero();
    }

    @Test
    @DisplayName("Should validate login request fields")
    void shouldValidateLoginRequestFields() throws Exception {
        // Given
        AuthRequest invalidRequest = new AuthRequest("", "");

        // When
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Email et mot de passe requis."));
    }

    @Test
    @DisplayName("Should handle email case insensitivity for registration")
    void shouldHandleEmailCaseInsensitivityForRegistration() throws Exception {
        // Given
        RegisterRequest upperCaseRequest = new RegisterRequest("Test User", "TEST@EXAMPLE.COM", "password123");

        // When
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(upperCaseRequest)))
                .andExpect(status().isCreated());

        // Then - verify user was saved with lowercase email
        User savedUser = userRepository.findByEmail("test@example.com").orElse(null);
        assertThat(savedUser).isNotNull();
        assertThat(savedUser.getEmail()).isEqualTo("test@example.com");
    }

    @Test
    @DisplayName("Should trim whitespace from registration fields")
    void shouldTrimWhitespaceFromRegistrationFields() throws Exception {
        // Given
        RegisterRequest requestWithWhitespace = new RegisterRequest("  Test User  ", "  test@example.com  ", "password123");

        // When
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestWithWhitespace)))
                .andExpect(status().isCreated());

        // Then - verify whitespace was trimmed
        User savedUser = userRepository.findByEmail("test@example.com").orElse(null);
        assertThat(savedUser).isNotNull();
        assertThat(savedUser.getNom()).isEqualTo("Test User");
        assertThat(savedUser.getEmail()).isEqualTo("test@example.com");
    }

    @Test
    @DisplayName("Should complete full registration and login flow")
    void shouldCompleteFullRegistrationAndLoginFlow() throws Exception {
        // Step 1: Register user
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.token").exists());

        // Step 2: Login with the same credentials
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(authRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.token").exists());

        // Step 3: Verify user exists in database with expected properties
        User savedUser = userRepository.findByEmail("integration@example.com").orElse(null);
        assertThat(savedUser).isNotNull();
        assertThat(savedUser.getNom()).isEqualTo("Integration Test User");
        assertThat(savedUser.getEmail()).isEqualTo("integration@example.com");
        assertThat(savedUser.getIsActive()).isTrue();
        assertThat(savedUser.getIdioma()).isEqualTo(User.Idioma.PT);
        assertThat(savedUser.getCreatedAt()).isNotNull();
        assertThat(savedUser.getUpdatedAt()).isNotNull();
        assertThat(savedUser.getDerniereConnexion()).isNotNull();
    }
}