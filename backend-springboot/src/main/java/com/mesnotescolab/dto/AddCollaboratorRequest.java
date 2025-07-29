package com.mesnotescolab.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record AddCollaboratorRequest(
    @NotBlank(message = "L'email est requis")
    @Email(message = "L'email doit être valide")
    String email,

    @Pattern(regexp = "^(lecture|ecriture|admin)$", message = "La permission doit être: lecture, ecriture ou admin")
    String permission
) {
    public AddCollaboratorRequest {
        if (permission == null) permission = "lecture";
    }
}