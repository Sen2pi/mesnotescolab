package com.mesnotescolab.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitingConfig {

    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();

    public Bucket resolveBucket(String key, int capacity, int refillTokens, Duration refillPeriod) {
        return cache.computeIfAbsent(key, k -> createNewBucket(capacity, refillTokens, refillPeriod));
    }

    private Bucket createNewBucket(int capacity, int refillTokens, Duration refillPeriod) {
        Bandwidth limit = Bandwidth.classic(capacity, Refill.intervally(refillTokens, refillPeriod));
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }

    // Predefined bucket configurations
    public Bucket getLoginRateLimit(String clientIp) {
        return resolveBucket("login_" + clientIp, 5, 5, Duration.ofMinutes(15));
    }

    public Bucket getApiRateLimit(String clientIp) {
        return resolveBucket("api_" + clientIp, 100, 100, Duration.ofMinutes(1));
    }
}