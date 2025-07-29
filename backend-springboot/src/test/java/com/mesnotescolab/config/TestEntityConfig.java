package com.mesnotescolab.config;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.autoconfigure.domain.EntityScan;

@TestConfiguration
@EntityScan(basePackages = {"com.mesnotescolab.entity"})
public class TestEntityConfig {
    // This configuration ensures only User entity is scanned for tests
}