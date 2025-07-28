package com.mesnotescolab.service;

import com.mesnotescolab.entity.User;
import com.mesnotescolab.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserService Unit Tests")
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setNom("Test User");
        testUser.setEmail("test@example.com");
        testUser.setMotDePasse("encodedPassword");
        testUser.setIsActive(true);
    }

    @Test
    @DisplayName("Should load user by username successfully")
    void shouldLoadUserByUsername() {
        // Given
        when(userRepository.findActiveUserByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        // When
        UserDetails userDetails = userService.loadUserByUsername("test@example.com");

        // Then
        assertThat(userDetails).isNotNull();
        assertThat(userDetails.getUsername()).isEqualTo("test@example.com");
        assertThat(userDetails.isEnabled()).isTrue();
        verify(userRepository).findActiveUserByEmail("test@example.com");
    }

    @Test
    @DisplayName("Should throw UsernameNotFoundException when user not found")
    void shouldThrowUsernameNotFoundExceptionWhenUserNotFound() {
        // Given
        when(userRepository.findActiveUserByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> userService.loadUserByUsername("nonexistent@example.com"))
                .isInstanceOf(UsernameNotFoundException.class)
                .hasMessageContaining("Utilisateur non trouvé: nonexistent@example.com");
        
        verify(userRepository).findActiveUserByEmail("nonexistent@example.com");
    }

    @Test
    @DisplayName("Should create user successfully")
    void shouldCreateUserSuccessfully() {
        // Given
        String nom = "New User";
        String email = "new@example.com";
        String password = "password123";
        
        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // When
        User createdUser = userService.createUser(nom, email, password);

        // Then
        assertThat(createdUser).isNotNull();
        assertThat(createdUser.getId()).isEqualTo(1L);
        verify(userRepository).existsByEmail("new@example.com");
        verify(passwordEncoder).encode("password123");
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("Should throw RuntimeException when user already exists")
    void shouldThrowRuntimeExceptionWhenUserAlreadyExists() {
        // Given
        String nom = "New User";
        String email = "existing@example.com";
        String password = "password123";
        
        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        // When & Then
        assertThatThrownBy(() -> userService.createUser(nom, email, password))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Un compte avec cet email existe déjà.");
        
        verify(userRepository).existsByEmail("existing@example.com");
        verify(passwordEncoder, never()).encode(anyString());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should trim whitespace when creating user")
    void shouldTrimWhitespaceWhenCreatingUser() {
        // Given
        String nom = "  New User  ";
        String email = "  NEW@EXAMPLE.COM  ";
        String password = "password123";
        
        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User savedUser = invocation.getArgument(0);
            savedUser.setId(1L);
            return savedUser;
        });

        // When
        User createdUser = userService.createUser(nom, email, password);

        // Then
        verify(userRepository).existsByEmail("new@example.com");
        verify(userRepository).save(argThat(user -> 
            user.getNom().equals("New User") && 
            user.getEmail().equals("new@example.com")
        ));
    }

    @Test
    @DisplayName("Should find user by email")
    void shouldFindUserByEmail() {
        // Given
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        // When
        Optional<User> foundUser = userService.findByEmail("test@example.com");

        // Then
        assertThat(foundUser).isPresent();
        assertThat(foundUser.get().getEmail()).isEqualTo("test@example.com");
        verify(userRepository).findByEmail("test@example.com");
    }

    @Test
    @DisplayName("Should update user")
    void shouldUpdateUser() {
        // Given
        when(userRepository.save(testUser)).thenReturn(testUser);

        // When
        User updatedUser = userService.updateUser(testUser);

        // Then
        assertThat(updatedUser).isEqualTo(testUser);
        verify(userRepository).save(testUser);
    }

    @Test
    @DisplayName("Should update profile with nom and avatar")
    void shouldUpdateProfileWithNomAndAvatar() {
        // Given
        String newNom = "Updated User";
        String newAvatar = "new-avatar-url";
        
        when(userRepository.save(testUser)).thenReturn(testUser);

        // When
        User updatedUser = userService.updateProfile(testUser, newNom, newAvatar);

        // Then
        assertThat(updatedUser.getNom()).isEqualTo("Updated User");
        assertThat(updatedUser.getAvatar()).isEqualTo("new-avatar-url");
        verify(userRepository).save(testUser);
    }

    @Test
    @DisplayName("Should update profile with only nom")
    void shouldUpdateProfileWithOnlyNom() {
        // Given
        String newNom = "Updated User";
        
        when(userRepository.save(testUser)).thenReturn(testUser);

        // When
        User updatedUser = userService.updateProfile(testUser, newNom, null);

        // Then
        assertThat(updatedUser.getNom()).isEqualTo("Updated User");
        verify(userRepository).save(testUser);
    }

    @Test
    @DisplayName("Should not update profile with empty nom")
    void shouldNotUpdateProfileWithEmptyNom() {
        // Given
        String originalNom = testUser.getNom();
        
        when(userRepository.save(testUser)).thenReturn(testUser);

        // When
        User updatedUser = userService.updateProfile(testUser, "", null);

        // Then
        assertThat(updatedUser.getNom()).isEqualTo(originalNom);
        verify(userRepository).save(testUser);
    }

    @Test
    @DisplayName("Should change password successfully")
    void shouldChangePasswordSuccessfully() {
        // Given
        String oldPassword = "oldPassword";
        String newPassword = "newPassword";
        
        when(passwordEncoder.matches(oldPassword, testUser.getMotDePasse())).thenReturn(true);
        when(passwordEncoder.encode(newPassword)).thenReturn("newEncodedPassword");
        when(userRepository.save(testUser)).thenReturn(testUser);

        // When
        User updatedUser = userService.changePassword(testUser, oldPassword, newPassword);

        // Then
        assertThat(updatedUser.getMotDePasse()).isEqualTo("newEncodedPassword");
        verify(passwordEncoder).matches(oldPassword, "encodedPassword");
        verify(passwordEncoder).encode(newPassword);
        verify(userRepository).save(testUser);
    }

    @Test
    @DisplayName("Should throw RuntimeException when old password is incorrect")
    void shouldThrowRuntimeExceptionWhenOldPasswordIsIncorrect() {
        // Given
        String oldPassword = "wrongPassword";
        String newPassword = "newPassword";
        
        when(passwordEncoder.matches(oldPassword, testUser.getMotDePasse())).thenReturn(false);

        // When & Then
        assertThatThrownBy(() -> userService.changePassword(testUser, oldPassword, newPassword))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Ancien mot de passe incorrect.");
        
        verify(passwordEncoder).matches(oldPassword, "encodedPassword");
        verify(passwordEncoder, never()).encode(anyString());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should update last login")
    void shouldUpdateLastLogin() {
        // Given
        when(userRepository.save(testUser)).thenReturn(testUser);

        // When
        User updatedUser = userService.updateLastLogin(testUser);

        // Then
        assertThat(updatedUser).isNotNull();
        verify(userRepository).save(testUser);
    }
}