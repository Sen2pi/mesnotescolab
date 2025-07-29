package com.mesnotescolab.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "folders")
@EntityListeners(AuditingEntityListener.class)
public class Folder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le nom est requis")
    @Size(max = 100, message = "Le nom ne peut pas dépasser 100 caractères")
    @Column(nullable = false, length = 100)
    private String nom;

    @Size(max = 500, message = "La description ne peut pas dépasser 500 caractères")
    @Column(length = 500)
    private String description;

    @NotNull(message = "Le workspace est requis")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @NotNull(message = "Le propriétaire est requis")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proprietaire_id", nullable = false)
    private User proprietaire;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Folder parent;

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "La couleur doit être au format hexadécimal")
    @Column(length = 7)
    private String couleur = "#10b981";

    @Column(name = "is_public")
    private Boolean isPublic = false;

    @ElementCollection
    @CollectionTable(name = "folder_collaborateurs", joinColumns = @JoinColumn(name = "folder_id"))
    private List<Collaborateur> collaborateurs;

    @Column(name = "derniere_activite")
    private LocalDateTime derniereActivite = LocalDateTime.now();

    @CreatedDate
    @Column(nullable = false, updatable = false, name = "created_at")
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false, name = "updated_at")
    private LocalDateTime updatedAt;

    // Relationships
    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private Set<Folder> children;

    @OneToMany(mappedBy = "dossier", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private Set<Note> notes;

    // Constructors
    public Folder() {
        this.collaborateurs = new ArrayList<>();
        this.children = new HashSet<>();
        this.notes = new HashSet<>();
    }

    public Folder(String nom, Workspace workspace, User proprietaire) {
        this();
        this.nom = nom;
        this.workspace = workspace;
        this.proprietaire = proprietaire;
    }

    // Business methods
    public void updateActivity() {
        this.derniereActivite = LocalDateTime.now();
    }

    public boolean hasPermission(Long userId, String permission) {
        // Owner has all permissions
        if (proprietaire.getId().equals(userId)) {
            return true;
        }

        // Check collaborators
        return collaborateurs.stream()
                .anyMatch(collab -> collab.getUserId().equals(userId) && 
                         hasRequiredPermission(collab.getPermission().getValue(), permission));
    }

    private boolean hasRequiredPermission(String userPermission, String requiredPermission) {
        if ("admin".equals(userPermission)) return true;
        if ("ecriture".equals(userPermission) && ("ecriture".equals(requiredPermission) || "lecture".equals(requiredPermission))) return true;
        return "lecture".equals(userPermission) && "lecture".equals(requiredPermission);
    }

    public void addCollaborator(Long userId, String permission) {
        // Remove existing if present
        collaborateurs.removeIf(collab -> collab.getUserId().equals(userId));
        // Add new collaborator
        collaborateurs.add(new Collaborateur(userId, Collaborateur.Permission.valueOf(permission.toUpperCase())));
    }

    public void removeCollaborator(Long userId) {
        collaborateurs.removeIf(collab -> collab.getUserId().equals(userId));
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Workspace getWorkspace() { return workspace; }
    public void setWorkspace(Workspace workspace) { this.workspace = workspace; }

    public User getProprietaire() { return proprietaire; }
    public void setProprietaire(User proprietaire) { this.proprietaire = proprietaire; }

    public Folder getParent() { return parent; }
    public void setParent(Folder parent) { this.parent = parent; }

    public String getCouleur() { return couleur; }
    public void setCouleur(String couleur) { this.couleur = couleur; }

    public Boolean getIsPublic() { return isPublic; }
    public void setIsPublic(Boolean isPublic) { this.isPublic = isPublic; }

    public List<Collaborateur> getCollaborateurs() { return collaborateurs; }
    public void setCollaborateurs(List<Collaborateur> collaborateurs) { this.collaborateurs = collaborateurs; }

    public LocalDateTime getDerniereActivite() { return derniereActivite; }
    public void setDerniereActivite(LocalDateTime derniereActivite) { this.derniereActivite = derniereActivite; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public Set<Folder> getChildren() { return children; }
    public void setChildren(Set<Folder> children) { this.children = children; }

    public Set<Note> getNotes() { return notes; }
    public void setNotes(Set<Note> notes) { this.notes = notes; }
}