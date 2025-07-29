package com.mesnotescolab.dto;

import java.util.List;

public record MarkNotificationsRequest(
    List<Long> notificationIds,
    Boolean markAll
) {}