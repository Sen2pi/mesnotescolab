package com.mesnotescolab.dto;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("ApiResponse DTO Tests")
class ApiResponseTest {

    @Test
    @DisplayName("Should create success response without data")
    void shouldCreateSuccessResponseWithoutData() {
        // When
        ApiResponse<String> response = ApiResponse.success("Operation successful");

        // Then
        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getMessage()).isEqualTo("Operation successful");
        assertThat(response.getData()).isNull();
        assertThat(response.getErrors()).isNull();
    }

    @Test
    @DisplayName("Should create success response with data")
    void shouldCreateSuccessResponseWithData() {
        // Given
        String data = "test data";

        // When
        ApiResponse<String> response = ApiResponse.success("Operation successful", data);

        // Then
        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getMessage()).isEqualTo("Operation successful");
        assertThat(response.getData()).isEqualTo("test data");
        assertThat(response.getErrors()).isNull();
    }

    @Test
    @DisplayName("Should create error response without errors")
    void shouldCreateErrorResponseWithoutErrors() {
        // When
        ApiResponse<String> response = ApiResponse.error("Operation failed");

        // Then
        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getMessage()).isEqualTo("Operation failed");
        assertThat(response.getData()).isNull();
        assertThat(response.getErrors()).isNull();
    }

    @Test
    @DisplayName("Should create error response with errors")
    void shouldCreateErrorResponseWithErrors() {
        // Given
        List<String> errors = List.of("Error 1", "Error 2");

        // When
        ApiResponse<String> response = ApiResponse.error("Validation failed", errors);

        // Then
        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getMessage()).isEqualTo("Validation failed");
        assertThat(response.getData()).isNull();
        assertThat(response.getErrors()).isEqualTo(errors);
    }

    @Test
    @DisplayName("Should create ApiResponse with default constructor")
    void shouldCreateApiResponseWithDefaultConstructor() {
        // When
        ApiResponse<String> response = new ApiResponse<>();
        response.setSuccess(true);
        response.setMessage("Test message");
        response.setData("Test data");
        response.setErrors("Test errors");

        // Then
        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getMessage()).isEqualTo("Test message");
        assertThat(response.getData()).isEqualTo("Test data");
        assertThat(response.getErrors()).isEqualTo("Test errors");
    }

    @Test
    @DisplayName("Should create ApiResponse with success and message constructor")
    void shouldCreateApiResponseWithSuccessAndMessageConstructor() {
        // When
        ApiResponse<String> response = new ApiResponse<>(true, "Success message");

        // Then
        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getMessage()).isEqualTo("Success message");
        assertThat(response.getData()).isNull();
        assertThat(response.getErrors()).isNull();
    }

    @Test
    @DisplayName("Should create ApiResponse with all parameters constructor")
    void shouldCreateApiResponseWithAllParametersConstructor() {
        // Given
        String data = "test data";

        // When
        ApiResponse<String> response = new ApiResponse<>(true, "Success message", data);

        // Then
        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getMessage()).isEqualTo("Success message");
        assertThat(response.getData()).isEqualTo("test data");
        assertThat(response.getErrors()).isNull();
    }

    @Test
    @DisplayName("Should handle complex data types")
    void shouldHandleComplexDataTypes() {
        // Given
        ComplexData complexData = new ComplexData("test", 123);

        // When
        ApiResponse<ComplexData> response = ApiResponse.success("Complex data retrieved", complexData);

        // Then
        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getMessage()).isEqualTo("Complex data retrieved");
        assertThat(response.getData()).isEqualTo(complexData);
        assertThat(response.getData().getName()).isEqualTo("test");
        assertThat(response.getData().getValue()).isEqualTo(123);
    }

    @Test
    @DisplayName("Should handle null data")
    void shouldHandleNullData() {
        // When
        ApiResponse<String> response = ApiResponse.success("Success", null);

        // Then
        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getMessage()).isEqualTo("Success");
        assertThat(response.getData()).isNull();
    }

    @Test
    @DisplayName("Should handle null errors")
    void shouldHandleNullErrors() {
        // When
        ApiResponse<String> response = ApiResponse.error("Error", null);

        // Then
        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getMessage()).isEqualTo("Error");
        assertThat(response.getErrors()).isNull();
    }

    @Test
    @DisplayName("Should set errors after creation")
    void shouldSetErrorsAfterCreation() {
        // Given
        ApiResponse<String> response = ApiResponse.error("Validation failed");
        List<String> errors = List.of("Field 1 is required", "Field 2 is invalid");

        // When
        response.setErrors(errors);

        // Then
        assertThat(response.getErrors()).isEqualTo(errors);
    }

    // Helper class for testing complex data types
    private static class ComplexData {
        private String name;
        private int value;

        public ComplexData(String name, int value) {
            this.name = name;
            this.value = value;
        }

        public String getName() { return name; }
        public int getValue() { return value; }

        @Override
        public boolean equals(Object obj) {
            if (this == obj) return true;
            if (obj == null || getClass() != obj.getClass()) return false;
            ComplexData that = (ComplexData) obj;
            return value == that.value && name.equals(that.name);
        }

        @Override
        public int hashCode() {
            return name.hashCode() + value;
        }
    }
}