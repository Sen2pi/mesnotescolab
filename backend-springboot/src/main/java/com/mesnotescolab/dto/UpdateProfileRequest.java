package com.mesnotescolab.dto;

import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
    @Size(max = 50, message = "Le nom ne peut pas dépasser 50 caractères")
    String nom,

    @Size(max = 500, message = "L'avatar ne peut pas dépasser 500 caractères")
    String avatar
) {}