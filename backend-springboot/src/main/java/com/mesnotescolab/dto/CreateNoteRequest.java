package com.mesnotescolab.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public class CreateNoteRequest {

    @NotBlank(message = "Le titre est requis")
    @Size(max = 100, message = "Le titre ne peut pas dépasser 100 caractères")
    private String titre;

    @NotBlank(message = "Le contenu est requis")
    @Size(max = 50000, message = "Le contenu ne peut pas dépasser 50000 caractères")
    private String contenu;

    @NotNull(message = "Le workspace est requis")
    private Long workspace;

    private Long dossier;

    private Long parent;

    private List<String> tags;

    private Boolean isPublic = false;

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "La couleur doit être au format hexadécimal")
    private String couleur = "#ffffff";

    // Constructors
    public CreateNoteRequest() {}

    // Getters and Setters
    public String getTitre() { return titre; }
    public void setTitre(String titre) { this.titre = titre; }

    public String getContenu() { return contenu; }
    public void setContenu(String contenu) { this.contenu = contenu; }

    public Long getWorkspace() { return workspace; }
    public void setWorkspace(Long workspace) { this.workspace = workspace; }

    public Long getDossier() { return dossier; }
    public void setDossier(Long dossier) { this.dossier = dossier; }

    public Long getParent() { return parent; }
    public void setParent(Long parent) { this.parent = parent; }

    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }

    public Boolean getIsPublic() { return isPublic; }
    public void setIsPublic(Boolean isPublic) { this.isPublic = isPublic; }

    public String getCouleur() { return couleur; }
    public void setCouleur(String couleur) { this.couleur = couleur; }
}