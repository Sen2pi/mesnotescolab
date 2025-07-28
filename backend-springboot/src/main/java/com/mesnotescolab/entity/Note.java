package com.mesnotescolab.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "notes")
@EntityListeners(AuditingEntityListener.class)
public class Note {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le titre est requis")
    @Size(max = 100, message = "Le titre ne peut pas dépasser 100 caractères")
    @Column(nullable = false, length = 100)
    private String titre;

    @NotBlank(message = "Le contenu est requis")
    @Size(max = 50000, message = "Le contenu ne peut pas dépasser 50000 caractères")
    @Column(nullable = false, length = 50000)
    private String contenu;

    @NotNull(message = "L'auteur est requis")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auteur_id", nullable = false)
    private User auteur;

    @NotNull(message = "Le workspace est requis")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dossier_id")
    private Folder dossier;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Note parent;

    @ElementCollection
    @CollectionTable(name = "note_collaborateurs", joinColumns = @JoinColumn(name = "note_id"))
    private List<Collaborateur> collaborateurs;

    @ElementCollection
    @CollectionTable(name = "note_tags", joinColumns = @JoinColumn(name = "note_id"))
    @Column(name = "tag", length = 30)
    private List<String> tags;

    @Column(name = "is_public")
    private Boolean isPublic = false;

    @Column(name = "is_archived")
    private Boolean isArchived = false;

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "La couleur doit être au format hexadécimal")
    @Column(length = 7)
    private String couleur = "#ffffff";

    @Column(nullable = false)
    private Integer version = 1;

    @Column(name = "derniere_activite")
    private LocalDateTime derniereActivite = LocalDateTime.now();

    @ElementCollection
    @CollectionTable(name = "note_references", joinColumns = @JoinColumn(name = "note_id"))
    private List<NoteReference> references;

    @CreatedDate
    @Column(nullable = false, updatable = false, name = "created_at")
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false, name = "updated_at")
    private LocalDateTime updatedAt;

    // Relationships
    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private Set<Note> children;

    @OneToMany(mappedBy = "noteId", cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "note_id", insertable = false, updatable = false)
    @JsonIgnore
    private Set<Notification> notifications;

    // Constructors
    public Note() {}

    public Note(String titre, String contenu, User auteur, Workspace workspace) {
        this.titre = titre;
        this.contenu = contenu;
        this.auteur = auteur;
        this.workspace = workspace;
    }

    // Business methods
    public void updateActivity() {
        this.derniereActivite = LocalDateTime.now();
    }

    public void incrementVersion() {
        this.version++;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitre() { return titre; }
    public void setTitre(String titre) { this.titre = titre; }

    public String getContenu() { return contenu; }
    public void setContenu(String contenu) { this.contenu = contenu; }

    public User getAuteur() { return auteur; }
    public void setAuteur(User auteur) { this.auteur = auteur; }

    public Workspace getWorkspace() { return workspace; }
    public void setWorkspace(Workspace workspace) { this.workspace = workspace; }

    public Folder getDossier() { return dossier; }
    public void setDossier(Folder dossier) { this.dossier = dossier; }

    public Note getParent() { return parent; }
    public void setParent(Note parent) { this.parent = parent; }

    public List<Collaborateur> getCollaborateurs() { return collaborateurs; }
    public void setCollaborateurs(List<Collaborateur> collaborateurs) { this.collaborateurs = collaborateurs; }

    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }

    public Boolean getIsPublic() { return isPublic; }
    public void setIsPublic(Boolean isPublic) { this.isPublic = isPublic; }

    public Boolean getIsArchived() { return isArchived; }
    public void setIsArchived(Boolean isArchived) { this.isArchived = isArchived; }

    public String getCouleur() { return couleur; }
    public void setCouleur(String couleur) { this.couleur = couleur; }

    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }

    public LocalDateTime getDerniereActivite() { return derniereActivite; }
    public void setDerniereActivite(LocalDateTime derniereActivite) { this.derniereActivite = derniereActivite; }

    public List<NoteReference> getReferences() { return references; }
    public void setReferences(List<NoteReference> references) { this.references = references; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public Set<Note> getChildren() { return children; }
    public void setChildren(Set<Note> children) { this.children = children; }

    public Set<Notification> getNotifications() { return notifications; }
    public void setNotifications(Set<Notification> notifications) { this.notifications = notifications; }
}