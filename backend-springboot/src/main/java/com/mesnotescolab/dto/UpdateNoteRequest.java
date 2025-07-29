package com.mesnotescolab.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public class UpdateNoteRequest {

    @Size(max = 100, message = "Le titre ne peut pas dépasser 100 caractères")
    private String titre;

    @Size(max = 50000, message = "Le contenu ne peut pas dépasser 50000 caractères")
    private String contenu;

    private List<String> tags;

    private Boolean isPublic;

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "La couleur doit être au format hexadécimal")
    private String couleur;

    // Constructors
    public UpdateNoteRequest() {}

    // Getters and Setters
    public String getTitre() { return titre; }
    public void setTitre(String titre) { this.titre = titre; }

    public String getContenu() { return contenu; }
    public void setContenu(String contenu) { this.contenu = contenu; }

    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }

    public Boolean getIsPublic() { return isPublic; }
    public void setIsPublic(Boolean isPublic) { this.isPublic = isPublic; }

    public String getCouleur() { return couleur; }
    public void setCouleur(String couleur) { this.couleur = couleur; }
}