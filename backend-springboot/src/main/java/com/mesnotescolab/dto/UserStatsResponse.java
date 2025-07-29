package com.mesnotescolab.dto;

public record UserStatsResponse(
    long totalNotes,
    long notesCreated,
    long notesCollaborated,
    long archivedNotes,
    long publicNotes
) {}