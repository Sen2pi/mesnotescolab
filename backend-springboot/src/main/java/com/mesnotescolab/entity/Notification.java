package com.mesnotescolab.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "notifications")
@EntityListeners(AuditingEntityListener.class)
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Le destinataire est requis")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destinataire_id", nullable = false)
    private User destinataire;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expediteur_id")
    private User expediteur;

    @Enumerated(EnumType.STRING)
    @NotNull(message = "Le type est requis")
    @Column(nullable = false)
    private TypeNotification type;

    @NotBlank(message = "Le message est requis")
    @Size(max = 500, message = "Le message ne peut pas dépasser 500 caractères")
    @Column(nullable = false, length = 500)
    private String message;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "note_id")
    private Note note;

    @Column(name = "is_lue")
    private Boolean isLue = false;

    @ElementCollection
    @CollectionTable(name = "notification_metadata", joinColumns = @JoinColumn(name = "notification_id"))
    @MapKeyColumn(name = "metadata_key")
    @Column(name = "metadata_value")
    private Map<String, String> metadata;

    @CreatedDate
    @Column(nullable = false, updatable = false, name = "created_at")
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false, name = "updated_at")
    private LocalDateTime updatedAt;

    // Constructors
    public Notification() {}

    public Notification(User destinataire, TypeNotification type, String message) {
        this.destinataire = destinataire;
        this.type = type;
        this.message = message;
    }

    public Notification(User destinataire, User expediteur, TypeNotification type, String message, Note note) {
        this.destinataire = destinataire;
        this.expediteur = expediteur;
        this.type = type;
        this.message = message;
        this.note = note;
    }

    // Business methods
    public void markAsRead() {
        this.isLue = true;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getDestinataire() { return destinataire; }
    public void setDestinataire(User destinataire) { this.destinataire = destinataire; }

    public User getExpediteur() { return expediteur; }
    public void setExpediteur(User expediteur) { this.expediteur = expediteur; }

    public TypeNotification getType() { return type; }
    public void setType(TypeNotification type) { this.type = type; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public Note getNote() { return note; }
    public void setNote(Note note) { this.note = note; }

    public Boolean getIsLue() { return isLue; }
    public void setIsLue(Boolean isLue) { this.isLue = isLue; }

    public Map<String, String> getMetadata() { return metadata; }
    public void setMetadata(Map<String, String> metadata) { this.metadata = metadata; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public enum TypeNotification {
        PARTAGE("partage"),
        MODIFICATION("modification"),
        COMMENTAIRE("commentaire"),
        INVITATION("invitation"),
        SYSTEME("systeme");

        private final String value;

        TypeNotification(String value) {
            this.value = value;
        }

        public String getValue() {
            return value;
        }
    }
}