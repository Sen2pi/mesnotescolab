package com.mesnotescolab.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateNoteRequest(
    @NotBlank(message = "Le titre est requis")
    @Size(max = 100, message = "Le titre ne peut pas dépasser 100 caractères")
    String titre,

    @NotBlank(message = "Le contenu est requis")
    @Size(max = 50000, message = "Le contenu ne peut pas dépasser 50000 caractères")
    String contenu,

    @NotNull(message = "Le workspace est requis")
    Long workspace,

    Long dossier,

    Long parent,

    List<String> tags,

    Boolean isPublic,

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "La couleur doit être au format hexadécimal")
    String couleur
) {
    public CreateNoteRequest {
        if (isPublic == null) isPublic = false;
        if (couleur == null) couleur = "#ffffff";
    }
}