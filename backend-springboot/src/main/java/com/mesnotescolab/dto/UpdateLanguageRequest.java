package com.mesnotescolab.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class UpdateLanguageRequest {

    @NotBlank(message = "L'idioma est requis")
    @Pattern(regexp = "^(pt|fr|en|de)$", message = "L'idioma doit être: pt, fr, en ou de")
    private String idioma;

    // Constructors
    public UpdateLanguageRequest() {}

    public UpdateLanguageRequest(String idioma) {
        this.idioma = idioma;
    }

    // Getters and Setters
    public String getIdioma() { return idioma; }
    public void setIdioma(String idioma) { this.idioma = idioma; }
}