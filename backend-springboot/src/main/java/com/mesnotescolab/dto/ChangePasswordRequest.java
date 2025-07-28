package com.mesnotescolab.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ChangePasswordRequest {

    @NotBlank(message = "Ancien mot de passe requis")
    private String ancienMotDePasse;

    @NotBlank(message = "Nouveau mot de passe requis")
    @Size(min = 6, message = "Le nouveau mot de passe doit contenir au moins 6 caractères")
    private String nouveauMotDePasse;

    // Constructors
    public ChangePasswordRequest() {}

    public ChangePasswordRequest(String ancienMotDePasse, String nouveauMotDePasse) {
        this.ancienMotDePasse = ancienMotDePasse;
        this.nouveauMotDePasse = nouveauMotDePasse;
    }

    // Getters and Setters
    public String getAncienMotDePasse() { return ancienMotDePasse; }
    public void setAncienMotDePasse(String ancienMotDePasse) { this.ancienMotDePasse = ancienMotDePasse; }

    public String getNouveauMotDePasse() { return nouveauMotDePasse; }
    public void setNouveauMotDePasse(String nouveauMotDePasse) { this.nouveauMotDePasse = nouveauMotDePasse; }
}