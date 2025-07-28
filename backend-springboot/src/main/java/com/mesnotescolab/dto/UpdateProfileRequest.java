package com.mesnotescolab.dto;

import jakarta.validation.constraints.Size;

public class UpdateProfileRequest {

    @Size(max = 50, message = "Le nom ne peut pas dépasser 50 caractères")
    private String nom;

    @Size(max = 500, message = "L'avatar ne peut pas dépasser 500 caractères")
    private String avatar;

    // Constructors
    public UpdateProfileRequest() {}

    public UpdateProfileRequest(String nom, String avatar) {
        this.nom = nom;
        this.avatar = avatar;
    }

    // Getters and Setters
    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }

    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }
}