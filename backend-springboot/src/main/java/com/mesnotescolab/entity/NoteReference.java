package com.mesnotescolab.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Embeddable
@EntityListeners(AuditingEntityListener.class)
public class NoteReference {

    @NotNull
    @Column(name = "note_id")
    private Long noteId;

    @Embedded
    private Position position;

    @CreatedDate
    @Column(nullable = false, updatable = false, name = "created_at")
    private LocalDateTime createdAt;

    // Constructors
    public NoteReference() {}

    public NoteReference(Long noteId, Position position) {
        this.noteId = noteId;
        this.position = position;
    }

    // Getters and Setters
    public Long getNoteId() { return noteId; }
    public void setNoteId(Long noteId) { this.noteId = noteId; }

    public Position getPosition() { return position; }
    public void setPosition(Position position) { this.position = position; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    @Embeddable
    public static class Position {
        @Column(name = "start_position")
        private Integer start;

        @Column(name = "end_position")
        private Integer end;

        public Position() {}

        public Position(Integer start, Integer end) {
            this.start = start;
            this.end = end;
        }

        public Integer getStart() { return start; }
        public void setStart(Integer start) { this.start = start; }

        public Integer getEnd() { return end; }
        public void setEnd(Integer end) { this.end = end; }
    }
}