package com.mesnotescolab.repository;

import com.mesnotescolab.entity.Folder;
import com.mesnotescolab.entity.User;
import com.mesnotescolab.entity.Workspace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FolderRepository extends JpaRepository<Folder, Long> {

    @Query("SELECT f FROM Folder f WHERE " +
           "f.workspace = :workspace AND " +
           "(f.proprietaire = :user OR " +
           "EXISTS (SELECT 1 FROM f.collaborateurs c WHERE c.userId = :userId) OR " +
           "f.isPublic = true)")
    List<Folder> findByWorkspaceAccessible(@Param("workspace") Workspace workspace, 
                                          @Param("user") User user, 
                                          @Param("userId") Long userId);

    @Query("SELECT f FROM Folder f WHERE " +
           "f.workspace.id = :workspaceId AND " +
           "(f.proprietaire = :user OR " +
           "EXISTS (SELECT 1 FROM f.collaborateurs c WHERE c.userId = :userId) OR " +
           "f.isPublic = true) AND " +
           "LOWER(f.nom) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Folder> searchFolders(@Param("workspaceId") Long workspaceId, 
                              @Param("user") User user, 
                              @Param("userId") Long userId, 
                              @Param("search") String search);

    @Query("SELECT f FROM Folder f WHERE f.parent IS NULL AND f.workspace.id = :workspaceId AND " +
           "(f.proprietaire = :user OR " +
           "EXISTS (SELECT 1 FROM f.collaborateurs c WHERE c.userId = :userId) OR " +
           "f.isPublic = true)")
    List<Folder> findRootFolders(@Param("workspaceId") Long workspaceId, 
                                @Param("user") User user, 
                                @Param("userId") Long userId);

    boolean existsByParentId(Long parentId);
    boolean existsByWorkspaceId(Long workspaceId);
}