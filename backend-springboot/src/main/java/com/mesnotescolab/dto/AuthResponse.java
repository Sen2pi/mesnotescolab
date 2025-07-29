package com.mesnotescolab.dto;

import com.mesnotescolab.entity.User;

public record AuthResponse(
    User user,
    String token
) {}