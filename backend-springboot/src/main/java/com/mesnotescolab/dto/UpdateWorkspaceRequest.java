package com.mesnotescolab.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateWorkspaceRequest(
    @Size(max = 100, message = "Le nom ne peut pas dépasser 100 caractères")
    String nom,

    @Size(max = 500, message = "La description ne peut pas dépasser 500 caractères")
    String description,

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "La couleur doit être au format hexadécimal")
    String couleur,

    Boolean isPublic
) {}