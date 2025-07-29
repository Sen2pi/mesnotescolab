package com.mesnotescolab.repository;

import com.mesnotescolab.entity.Note;
import com.mesnotescolab.entity.User;
import com.mesnotescolab.entity.Workspace;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NoteRepository extends JpaRepository<Note, Long> {

    @Query("SELECT n FROM Note n WHERE " +
           "(n.auteur = :user OR " +
           "EXISTS (SELECT 1 FROM n.collaborateurs c WHERE c.userId = :userId) OR " +
           "n.isPublic = true) AND " +
           "n.isArchived = :archived")
    Page<Note> findAccessibleNotes(@Param("user") User user, 
                                   @Param("userId") Long userId, 
                                   @Param("archived") Boolean archived, 
                                   Pageable pageable);

    @Query("SELECT n FROM Note n WHERE " +
           "(n.auteur = :user OR " +
           "EXISTS (SELECT 1 FROM n.collaborateurs c WHERE c.userId = :userId) OR " +
           "n.isPublic = true) AND " +
           "n.isArchived = false AND " +
           "(LOWER(n.titre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(n.contenu) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<Note> searchNotes(@Param("user") User user, 
                          @Param("userId") Long userId, 
                          @Param("search") String search);

    @Query("SELECT n FROM Note n WHERE " +
           "n.workspace = :workspace AND " +
           "(n.auteur = :user OR " +
           "EXISTS (SELECT 1 FROM n.collaborateurs c WHERE c.userId = :userId) OR " +
           "n.isPublic = true) AND " +
           "n.isArchived = false")
    List<Note> findByWorkspaceAccessible(@Param("workspace") Workspace workspace, 
                                        @Param("user") User user, 
                                        @Param("userId") Long userId);

    @Query("SELECT n FROM Note n WHERE " +
           "n.dossier.id = :folderId AND " +
           "(n.auteur = :user OR " +
           "EXISTS (SELECT 1 FROM n.collaborateurs c WHERE c.userId = :userId) OR " +
           "n.isPublic = true) AND " +
           "n.isArchived = false")
    List<Note> findByFolderAccessible(@Param("folderId") Long folderId, 
                                     @Param("user") User user, 
                                     @Param("userId") Long userId);

    @Query("SELECT n FROM Note n WHERE " +
           "n.parent.id = :parentId AND " +
           "(n.auteur = :user OR " +
           "EXISTS (SELECT 1 FROM n.collaborateurs c WHERE c.userId = :userId) OR " +
           "n.isPublic = true) AND " +
           "n.isArchived = false")
    List<Note> findChildrenAccessible(@Param("parentId") Long parentId, 
                                     @Param("user") User user, 
                                     @Param("userId") Long userId);

    @Query("SELECT n FROM Note n WHERE " +
           "(n.auteur = :user OR " +
           "EXISTS (SELECT 1 FROM n.collaborateurs c WHERE c.userId = :userId) OR " +
           "n.isPublic = true) AND " +
           "n.isArchived = false AND " +
           "LOWER(n.titre) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Note> findByTitleContainingIgnoreCase(@Param("search") String search, 
                                              @Param("user") User user, 
                                              @Param("userId") Long userId);

    @Query("SELECT COUNT(n) FROM Note n WHERE n.auteur = :user AND n.isArchived = :archived")
    long countByAuteurAndIsArchived(@Param("user") User user, @Param("archived") Boolean archived);

    @Query("SELECT COUNT(DISTINCT n) FROM Note n JOIN n.collaborateurs c WHERE c.userId = :userId AND n.isArchived = :archived")
    long countByCollaboratorAndIsArchived(@Param("userId") Long userId, @Param("archived") Boolean archived);

    @Query("SELECT COUNT(n) FROM Note n WHERE n.auteur = :user AND n.isPublic = true")
    long countByAuteurAndIsPublic(@Param("user") User user);

    boolean existsByWorkspaceId(Long workspaceId);
    boolean existsByDossierId(Long dossierId);
}