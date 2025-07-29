package com.mesnotescolab.dto;

import java.util.List;

public class MarkNotificationsRequest {
    private List<Long> notificationIds;
    private Boolean markAll;

    // Constructors
    public MarkNotificationsRequest() {}

    public MarkNotificationsRequest(List<Long> notificationIds, Boolean markAll) {
        this.notificationIds = notificationIds;
        this.markAll = markAll;
    }

    // Getters and Setters
    public List<Long> getNotificationIds() { return notificationIds; }
    public void setNotificationIds(List<Long> notificationIds) { this.notificationIds = notificationIds; }

    public Boolean getMarkAll() { return markAll; }
    public void setMarkAll(Boolean markAll) { this.markAll = markAll; }
}