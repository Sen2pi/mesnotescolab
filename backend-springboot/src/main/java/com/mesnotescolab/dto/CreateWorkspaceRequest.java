package com.mesnotescolab.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateWorkspaceRequest(
    @NotBlank(message = "Le nom est requis")
    @Size(max = 100, message = "Le nom ne peut pas dépasser 100 caractères")
    String nom,

    @Size(max = 500, message = "La description ne peut pas dépasser 500 caractères")
    String description,

    Long parent,

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "La couleur doit être au format hexadécimal")
    String couleur,

    Boolean isPublic
) {
    public CreateWorkspaceRequest {
        if (couleur == null) couleur = "#667eea";
        if (isPublic == null) isPublic = false;
    }
}