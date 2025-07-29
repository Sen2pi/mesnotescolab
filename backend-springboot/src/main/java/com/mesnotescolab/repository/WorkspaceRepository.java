package com.mesnotescolab.repository;

import com.mesnotescolab.entity.User;
import com.mesnotescolab.entity.Workspace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkspaceRepository extends JpaRepository<Workspace, Long> {

    @Query("SELECT w FROM Workspace w WHERE " +
           "w.proprietaire = :user OR " +
           "EXISTS (SELECT 1 FROM w.collaborateurs c WHERE c.userId = :userId) OR " +
           "(:includePublic = true AND w.isPublic = true)")
    List<Workspace> findByUserAccess(@Param("user") User user, 
                                    @Param("userId") Long userId, 
                                    @Param("includePublic") boolean includePublic);

    @Query("SELECT w FROM Workspace w WHERE " +
           "(w.proprietaire = :user OR " +
           "EXISTS (SELECT 1 FROM w.collaborateurs c WHERE c.userId = :userId) OR " +
           "w.isPublic = true) AND " +
           "LOWER(w.nom) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Workspace> searchWorkspaces(@Param("user") User user, 
                                    @Param("userId") Long userId, 
                                    @Param("search") String search);

    @Query("SELECT w FROM Workspace w WHERE w.parent IS NULL AND " +
           "(w.proprietaire = :user OR " +
           "EXISTS (SELECT 1 FROM w.collaborateurs c WHERE c.userId = :userId) OR " +
           "w.isPublic = true)")
    List<Workspace> findRootWorkspaces(@Param("user") User user, 
                                      @Param("userId") Long userId);

    boolean existsByParentId(Long parentId);
}