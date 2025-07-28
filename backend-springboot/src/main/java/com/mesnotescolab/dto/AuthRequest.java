package com.mesnotescolab.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthRequest {

    @NotBlank(message = "Email é obrigatório")
    @Email(message = "Email inválido")
    private String email;

    @NotBlank(message = "Le mot de passe est requis")
    @Size(min = 6, message = "Le mot de passe doit contenir au moins 6 caractères")
    private String motDePasse;

    // Constructors
    public AuthRequest() {}

    public AuthRequest(String email, String motDePasse) {
        this.email = email;
        this.motDePasse = motDePasse;
    }

    // Getters and Setters
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getMotDePasse() { return motDePasse; }
    public void setMotDePasse(String motDePasse) { this.motDePasse = motDePasse; }
}