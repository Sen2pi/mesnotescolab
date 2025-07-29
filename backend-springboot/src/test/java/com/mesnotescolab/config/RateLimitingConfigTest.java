package com.mesnotescolab.config;

import io.github.bucket4j.Bucket;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Duration;

import static org.assertj.core.api.Assertions.*;

@DisplayName("RateLimitingConfig Tests")
class RateLimitingConfigTest {

    private RateLimitingConfig rateLimitingConfig;

    @BeforeEach
    void setUp() {
        rateLimitingConfig = new RateLimitingConfig();
    }

    @Test
    @DisplayName("Should create bucket with specified capacity")
    void shouldCreateBucketWithSpecifiedCapacity() {
        // Given
        String key = "test-key";
        int capacity = 10;
        int refillTokens = 5;
        Duration refillPeriod = Duration.ofMinutes(1);

        // When
        Bucket bucket = rateLimitingConfig.resolveBucket(key, capacity, refillTokens, refillPeriod);

        // Then
        assertThat(bucket).isNotNull();
        assertThat(bucket.getAvailableTokens()).isEqualTo(capacity);
    }

    @Test
    @DisplayName("Should return same bucket for same key")
    void shouldReturnSameBucketForSameKey() {
        // Given
        String key = "same-key";
        int capacity = 5;
        int refillTokens = 2;
        Duration refillPeriod = Duration.ofMinutes(1);

        // When
        Bucket bucket1 = rateLimitingConfig.resolveBucket(key, capacity, refillTokens, refillPeriod);
        Bucket bucket2 = rateLimitingConfig.resolveBucket(key, capacity, refillTokens, refillPeriod);

        // Then
        assertThat(bucket1).isSameAs(bucket2);
    }

    @Test
    @DisplayName("Should return different buckets for different keys")
    void shouldReturnDifferentBucketsForDifferentKeys() {
        // Given
        String key1 = "key1";
        String key2 = "key2";
        int capacity = 5;
        int refillTokens = 2;
        Duration refillPeriod = Duration.ofMinutes(1);

        // When
        Bucket bucket1 = rateLimitingConfig.resolveBucket(key1, capacity, refillTokens, refillPeriod);
        Bucket bucket2 = rateLimitingConfig.resolveBucket(key2, capacity, refillTokens, refillPeriod);

        // Then
        assertThat(bucket1).isNotSameAs(bucket2);
    }

    @Test
    @DisplayName("Should consume tokens from bucket")
    void shouldConsumeTokensFromBucket() {
        // Given
        String key = "consume-test";
        int capacity = 10;
        int refillTokens = 5;
        Duration refillPeriod = Duration.ofMinutes(1);
        Bucket bucket = rateLimitingConfig.resolveBucket(key, capacity, refillTokens, refillPeriod);

        // When
        boolean consumed = bucket.tryConsume(3);

        // Then
        assertThat(consumed).isTrue();
        assertThat(bucket.getAvailableTokens()).isEqualTo(7);
    }

    @Test
    @DisplayName("Should reject when not enough tokens")
    void shouldRejectWhenNotEnoughTokens() {
        // Given
        String key = "reject-test";
        int capacity = 5;
        int refillTokens = 2;
        Duration refillPeriod = Duration.ofMinutes(1);
        Bucket bucket = rateLimitingConfig.resolveBucket(key, capacity, refillTokens, refillPeriod);

        // When
        boolean consumed = bucket.tryConsume(10); // More than capacity

        // Then
        assertThat(consumed).isFalse();
        assertThat(bucket.getAvailableTokens()).isEqualTo(5); // Unchanged
    }

    @Test
    @DisplayName("Should get login rate limit bucket")
    void shouldGetLoginRateLimitBucket() {
        // Given
        String clientIp = "192.168.1.1";

        // When
        Bucket bucket = rateLimitingConfig.getLoginRateLimit(clientIp);

        // Then
        assertThat(bucket).isNotNull();
        assertThat(bucket.getAvailableTokens()).isEqualTo(5); // Default login capacity
    }

    @Test
    @DisplayName("Should get API rate limit bucket")
    void shouldGetApiRateLimitBucket() {
        // Given
        String clientIp = "192.168.1.1";

        // When
        Bucket bucket = rateLimitingConfig.getApiRateLimit(clientIp);

        // Then
        assertThat(bucket).isNotNull();
        assertThat(bucket.getAvailableTokens()).isEqualTo(100); // Default API capacity
    }

    @Test
    @DisplayName("Should return different buckets for login and API limits")
    void shouldReturnDifferentBucketsForLoginAndApiLimits() {
        // Given
        String clientIp = "192.168.1.1";

        // When
        Bucket loginBucket = rateLimitingConfig.getLoginRateLimit(clientIp);
        Bucket apiBucket = rateLimitingConfig.getApiRateLimit(clientIp);

        // Then
        assertThat(loginBucket).isNotSameAs(apiBucket);
        assertThat(loginBucket.getAvailableTokens()).isEqualTo(5);
        assertThat(apiBucket.getAvailableTokens()).isEqualTo(100);
    }

    @Test
    @DisplayName("Should return same bucket for same client IP")
    void shouldReturnSameBucketForSameClientIp() {
        // Given
        String clientIp = "192.168.1.1";

        // When
        Bucket bucket1 = rateLimitingConfig.getLoginRateLimit(clientIp);
        Bucket bucket2 = rateLimitingConfig.getLoginRateLimit(clientIp);

        // Then
        assertThat(bucket1).isSameAs(bucket2);
    }

    @Test
    @DisplayName("Should return different buckets for different client IPs")
    void shouldReturnDifferentBucketsForDifferentClientIps() {
        // Given
        String clientIp1 = "192.168.1.1";
        String clientIp2 = "192.168.1.2";

        // When
        Bucket bucket1 = rateLimitingConfig.getLoginRateLimit(clientIp1);
        Bucket bucket2 = rateLimitingConfig.getLoginRateLimit(clientIp2);

        // Then
        assertThat(bucket1).isNotSameAs(bucket2);
    }
}