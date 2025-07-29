package com.mesnotescolab.dto;

import java.util.List;

public record PaginationResponse<T>(
    List<T> content,
    int currentPage,
    int totalPages,
    long totalElements,
    boolean hasNextPage,
    boolean hasPrevPage
) {
    public PaginationResponse(List<T> content, int currentPage, int totalPages, long totalElements) {
        this(content, currentPage, totalPages, totalElements, 
             currentPage < totalPages, currentPage > 1);
    }
}