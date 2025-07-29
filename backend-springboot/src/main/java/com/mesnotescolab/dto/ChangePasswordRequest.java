package com.mesnotescolab.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
    @NotBlank(message = "Ancien mot de passe requis")
    String ancienMotDePasse,

    @NotBlank(message = "Nouveau mot de passe requis")
    @Size(min = 6, message = "Le nouveau mot de passe doit contenir au moins 6 caractères")
    String nouveauMotDePasse
) {}