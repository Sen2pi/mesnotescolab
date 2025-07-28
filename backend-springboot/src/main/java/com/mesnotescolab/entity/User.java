package com.mesnotescolab.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Collections;
import java.util.Set;

@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_user_email", columnList = "email")
})
@EntityListeners(AuditingEntityListener.class)
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le nom est requis")
    @Size(max = 50, message = "Le nom ne peut pas dépasser 50 caractères")
    @Column(nullable = false, length = 50)
    private String nom;

    @NotBlank(message = "Email é obrigatório")
    @Email(message = "Email inválido")
    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Idioma idioma = Idioma.PT;

    @NotBlank(message = "Le mot de passe est requis")
    @Size(min = 6, message = "Le mot de passe doit contenir au moins 6 caractères")
    @JsonIgnore
    @Column(nullable = false, name = "mot_de_passe")
    private String motDePasse;

    @Column(length = 500)
    private String avatar;

    @Column(nullable = false, name = "is_active")
    private Boolean isActive = true;

    @Column(name = "derniere_connexion")
    private LocalDateTime derniereConnexion = LocalDateTime.now();

    @CreatedDate
    @Column(nullable = false, updatable = false, name = "created_at")
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false, name = "updated_at")
    private LocalDateTime updatedAt;

    // Relationships
    @OneToMany(mappedBy = "proprietaire", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private Set<Workspace> workspaces;

    @OneToMany(mappedBy = "proprietaire", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private Set<Folder> folders;

    @OneToMany(mappedBy = "auteur", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private Set<Note> notes;

    @OneToMany(mappedBy = "destinataire", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private Set<Notification> notifications;

    // Constructors
    public User() {}

    public User(String nom, String email, String motDePasse) {
        this.nom = nom;
        this.email = email;
        this.motDePasse = motDePasse;
    }

    // UserDetails implementation
    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public String getPassword() {
        return motDePasse;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.emptyList();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return isActive != null && isActive;
    }

    // Business methods
    public void updateLastLogin() {
        this.derniereConnexion = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public Idioma getIdioma() { return idioma; }
    public void setIdioma(Idioma idioma) { this.idioma = idioma; }

    public String getMotDePasse() { return motDePasse; }
    public void setMotDePasse(String motDePasse) { this.motDePasse = motDePasse; }

    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public LocalDateTime getDerniereConnexion() { return derniereConnexion; }
    public void setDerniereConnexion(LocalDateTime derniereConnexion) { this.derniereConnexion = derniereConnexion; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public Set<Workspace> getWorkspaces() { return workspaces; }
    public void setWorkspaces(Set<Workspace> workspaces) { this.workspaces = workspaces; }

    public Set<Folder> getFolders() { return folders; }
    public void setFolders(Set<Folder> folders) { this.folders = folders; }

    public Set<Note> getNotes() { return notes; }
    public void setNotes(Set<Note> notes) { this.notes = notes; }

    public Set<Notification> getNotifications() { return notifications; }
    public void setNotifications(Set<Notification> notifications) { this.notifications = notifications; }

    public enum Idioma {
        PT, FR, EN, DE
    }
}