package com.mesnotescolab.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateNoteRequest(
    @Size(max = 100, message = "Le titre ne peut pas dépasser 100 caractères")
    String titre,

    @Size(max = 50000, message = "Le contenu ne peut pas dépasser 50000 caractères")
    String contenu,

    List<String> tags,

    Boolean isPublic,

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "La couleur doit être au format hexadécimal")
    String couleur
) {}