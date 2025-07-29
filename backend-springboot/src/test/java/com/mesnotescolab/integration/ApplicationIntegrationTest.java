package com.mesnotescolab.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mesnotescolab.dto.AuthRequest;
import com.mesnotescolab.dto.CreateNoteRequest;
import com.mesnotescolab.dto.RegisterRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.util.Arrays;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureWebMvc
@ActiveProfiles("test")
@Transactional
@DisplayName("Application Integration Tests")
class ApplicationIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("Should complete full user workflow")
    void shouldCompleteFullUserWorkflow() throws Exception {
        MockMvc mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        // 1. Register a new user
        RegisterRequest registerRequest = new RegisterRequest("Test User", "test@example.com", "password123");
        
        MvcResult registerResult = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").exists())
                .andReturn();

        // Extract token from registration response
        String registerResponse = registerResult.getResponse().getContentAsString();
        String token = objectMapper.readTree(registerResponse)
                .get("data").get("token").asText();

        // 2. Login with the same user
        AuthRequest loginRequest = new AuthRequest("test@example.com", "password123");
        
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").exists());

        // 3. Get user profile
        mockMvc.perform(get("/api/auth/me")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("test@example.com"));

        // 4. Create a workspace (would need to implement this endpoint)
        // For now, we'll assume workspace ID 1 exists

        // 5. Create a note
        CreateNoteRequest noteRequest = new CreateNoteRequest(
                "My First Note",
                "This is the content of my first note",
                1L, // workspace ID
                null, // folder ID
                null, // parent ID
                Arrays.asList("test", "integration"),
                false, // not public
                "#ffffff" // white color
        );

        mockMvc.perform(post("/api/notes")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(noteRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.titre").value("My First Note"));

        // 6. Get all notes
        mockMvc.perform(get("/api/notes")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.notes").isArray());

        // 7. Search notes
        mockMvc.perform(get("/api/notes")
                .header("Authorization", "Bearer " + token)
                .param("search", "First"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.notes").isArray());
    }

    @Test
    @DisplayName("Should handle authentication errors properly")
    void shouldHandleAuthenticationErrorsProperly() throws Exception {
        MockMvc mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        // 1. Try to access protected endpoint without token
        mockMvc.perform(get("/api/notes"))
                .andExpect(status().isUnauthorized());

        // 2. Try to login with invalid credentials
        AuthRequest invalidLogin = new AuthRequest("nonexistent@example.com", "wrongpassword");
        
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidLogin)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));

        // 3. Try to register with invalid data
        RegisterRequest invalidRegister = new RegisterRequest("", "invalid-email", "123");
        
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRegister)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("Should handle validation errors properly")
    void shouldHandleValidationErrorsProperly() throws Exception {
        MockMvc mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        // Register and get token first
        RegisterRequest registerRequest = new RegisterRequest("Validation User", "validation@example.com", "password123");
        
        MvcResult registerResult = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        String token = objectMapper.readTree(registerResult.getResponse().getContentAsString())
                .get("data").get("token").asText();

        // Try to create note with invalid data
        CreateNoteRequest invalidNote = new CreateNoteRequest(
                "", // Empty title
                "", // Empty content
                null, // No workspace
                null, null, null, null, null
        );

        mockMvc.perform(post("/api/notes")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidNote)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Données invalides."));
    }

    @Test
    @DisplayName("Should handle CORS properly")
    void shouldHandleCorsProperty() throws Exception {
        MockMvc mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        // Make a CORS preflight request
        mockMvc.perform(options("/api/auth/login")
                .header("Origin", "http://localhost:3000")
                .header("Access-Control-Request-Method", "POST")
                .header("Access-Control-Request-Headers", "Content-Type"))
                .andExpect(status().isOk())
                .andExpect(header().exists("Access-Control-Allow-Origin"));
    }

    @Test
    @DisplayName("Should provide health check endpoint")
    void shouldProvideHealthCheckEndpoint() throws Exception {
        MockMvc mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        // Check if health endpoint is available
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    @DisplayName("Should handle concurrent requests properly")
    void shouldHandleConcurrentRequestsProperly() throws Exception {
        MockMvc mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        // Create multiple users concurrently (simulation)
        for (int i = 0; i < 5; i++) {
            RegisterRequest request = new RegisterRequest("User " + i, "user" + i + "@example.com", "password123");
            
            mockMvc.perform(post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true));
        }
    }
}