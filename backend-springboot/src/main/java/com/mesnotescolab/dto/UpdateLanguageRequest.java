package com.mesnotescolab.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UpdateLanguageRequest(
    @NotBlank(message = "L'idioma est requis")
    @Pattern(regexp = "^(pt|fr|en|de)$", message = "L'idioma doit être: pt, fr, en ou de")
    String idioma
) {}