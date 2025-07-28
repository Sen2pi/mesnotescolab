package com.mesnotescolab.service;

import com.mesnotescolab.entity.User;
import com.mesnotescolab.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return userRepository.findActiveUserByEmail(username)
                .orElseThrow(() -> new UsernameNotFoundException("Utilisateur non trouvé: " + username));
    }

    public User createUser(String nom, String email, String motDePasse) {
        if (userRepository.existsByEmail(email.toLowerCase().trim())) {
            throw new RuntimeException("Un compte avec cet email existe déjà.");
        }

        User user = new User();
        user.setNom(nom.trim());
        user.setEmail(email.toLowerCase().trim());
        user.setMotDePasse(passwordEncoder.encode(motDePasse));
        
        return userRepository.save(user);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public User updateUser(User user) {
        return userRepository.save(user);
    }

    public User updateProfile(User user, String nom, String avatar) {
        if (nom != null && !nom.trim().isEmpty()) {
            user.setNom(nom.trim());
        }
        
        if (avatar != null) {
            user.setAvatar(avatar);
        }
        
        return userRepository.save(user);
    }

    public User changePassword(User user, String oldPassword, String newPassword) {
        if (!passwordEncoder.matches(oldPassword, user.getMotDePasse())) {
            throw new RuntimeException("Ancien mot de passe incorrect.");
        }
        
        user.setMotDePasse(passwordEncoder.encode(newPassword));
        return userRepository.save(user);
    }

    public User updateLastLogin(User user) {
        user.updateLastLogin();
        return userRepository.save(user);
    }
}