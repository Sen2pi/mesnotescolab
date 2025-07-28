package com.mesnotescolab.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Embeddable
@EntityListeners(AuditingEntityListener.class)
public class Collaborateur {

    @NotNull
    @Column(name = "user_id")
    private Long userId;

    @Enumerated(EnumType.STRING)
    @NotNull
    @Column(nullable = false)
    private Permission permission;

    @CreatedDate
    @Column(nullable = false, updatable = false, name = "date_ajout")
    private LocalDateTime dateAjout;

    // Constructors
    public Collaborateur() {}

    public Collaborateur(Long userId, Permission permission) {
        this.userId = userId;
        this.permission = permission;
    }

    // Getters and Setters
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Permission getPermission() { return permission; }
    public void setPermission(Permission permission) { this.permission = permission; }

    public LocalDateTime getDateAjout() { return dateAjout; }
    public void setDateAjout(LocalDateTime dateAjout) { this.dateAjout = dateAjout; }

    public enum Permission {
        LECTURE("lecture"),
        ECRITURE("ecriture"),
        ADMIN("admin");

        private final String value;

        Permission(String value) {
            this.value = value;
        }

        public String getValue() {
            return value;
        }
    }
}