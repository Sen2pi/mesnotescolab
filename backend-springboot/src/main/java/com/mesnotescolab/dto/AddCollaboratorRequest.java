package com.mesnotescolab.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class AddCollaboratorRequest {

    @NotBlank(message = "L'email est requis")
    @Email(message = "L'email doit être valide")
    private String email;

    @Pattern(regexp = "^(lecture|ecriture|admin)$", message = "La permission doit être: lecture, ecriture ou admin")
    private String permission = "lecture";

    // Constructors
    public AddCollaboratorRequest() {}

    public AddCollaboratorRequest(String email, String permission) {
        this.email = email;
        this.permission = permission;
    }

    // Getters and Setters
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPermission() { return permission; }
    public void setPermission(String permission) { this.permission = permission; }
}