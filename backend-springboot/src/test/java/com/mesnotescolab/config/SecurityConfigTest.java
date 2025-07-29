package com.mesnotescolab.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.cors.CorsConfigurationSource;

import static org.assertj.core.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@DisplayName("SecurityConfig Tests")
class SecurityConfigTest {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private CorsConfigurationSource corsConfigurationSource;

    @Test
    @DisplayName("Should create AuthenticationManager bean")
    void shouldCreateAuthenticationManagerBean() {
        assertThat(authenticationManager).isNotNull();
    }

    @Test
    @DisplayName("Should create PasswordEncoder bean")
    void shouldCreatePasswordEncoderBean() {
        assertThat(passwordEncoder).isNotNull();
    }

    @Test
    @DisplayName("Should create CorsConfigurationSource bean")
    void shouldCreateCorsConfigurationSourceBean() {
        assertThat(corsConfigurationSource).isNotNull();
    }

    @Test
    @DisplayName("Should encode password correctly")
    void shouldEncodePasswordCorrectly() {
        // Given
        String rawPassword = "testPassword123";

        // When
        String encoded = passwordEncoder.encode(rawPassword);

        // Then
        assertThat(encoded).isNotNull();
        assertThat(encoded).isNotEqualTo(rawPassword);
        assertThat(passwordEncoder.matches(rawPassword, encoded)).isTrue();
    }

    @Test
    @DisplayName("Should not match wrong password")
    void shouldNotMatchWrongPassword() {
        // Given
        String rawPassword = "testPassword123";
        String wrongPassword = "wrongPassword";
        String encoded = passwordEncoder.encode(rawPassword);

        // When & Then
        assertThat(passwordEncoder.matches(wrongPassword, encoded)).isFalse();
    }

    @Test
    @DisplayName("Should generate different hashes for same password")
    void shouldGenerateDifferentHashesForSamePassword() {
        // Given
        String rawPassword = "testPassword123";

        // When
        String encoded1 = passwordEncoder.encode(rawPassword);
        String encoded2 = passwordEncoder.encode(rawPassword);

        // Then
        assertThat(encoded1).isNotEqualTo(encoded2);
        assertThat(passwordEncoder.matches(rawPassword, encoded1)).isTrue();
        assertThat(passwordEncoder.matches(rawPassword, encoded2)).isTrue();
    }
}