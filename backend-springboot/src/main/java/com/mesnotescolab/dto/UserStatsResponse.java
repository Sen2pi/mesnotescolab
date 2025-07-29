package com.mesnotescolab.dto;

public class UserStatsResponse {
    private long totalNotes;
    private long notesCreated;
    private long notesCollaborated;
    private long archivedNotes;
    private long publicNotes;

    // Constructors
    public UserStatsResponse() {}

    public UserStatsResponse(long totalNotes, long notesCreated, long notesCollaborated, 
                           long archivedNotes, long publicNotes) {
        this.totalNotes = totalNotes;
        this.notesCreated = notesCreated;
        this.notesCollaborated = notesCollaborated;
        this.archivedNotes = archivedNotes;
        this.publicNotes = publicNotes;
    }

    // Getters and Setters
    public long getTotalNotes() { return totalNotes; }
    public void setTotalNotes(long totalNotes) { this.totalNotes = totalNotes; }

    public long getNotesCreated() { return notesCreated; }
    public void setNotesCreated(long notesCreated) { this.notesCreated = notesCreated; }

    public long getNotesCollaborated() { return notesCollaborated; }
    public void setNotesCollaborated(long notesCollaborated) { this.notesCollaborated = notesCollaborated; }

    public long getArchivedNotes() { return archivedNotes; }
    public void setArchivedNotes(long archivedNotes) { this.archivedNotes = archivedNotes; }

    public long getPublicNotes() { return publicNotes; }
    public void setPublicNotes(long publicNotes) { this.publicNotes = publicNotes; }
}