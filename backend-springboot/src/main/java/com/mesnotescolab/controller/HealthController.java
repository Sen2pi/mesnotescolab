package com.mesnotescolab.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.lang.management.ManagementFactory;
import java.sql.Connection;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class HealthController {

    @Autowired
    private DataSource dataSource;

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> health = new HashMap<>();
        
        try {
            // Check database connection
            try (Connection connection = dataSource.getConnection()) {
                health.put("database", connection.isValid(5) ? "Connected" : "Disconnected");
            }
        } catch (Exception e) {
            health.put("database", "Disconnected");
        }
        
        health.put("status", "OK");
        health.put("message", "Service en fonctionnement");
        health.put("timestamp", LocalDateTime.now().toString());
        health.put("uptime", getUptime());
        
        return ResponseEntity.ok(health);
    }

    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> root() {
        Map<String, Object> info = new HashMap<>();
        info.put("message", "API Mes Notes Colab");
        info.put("documentation", "/swagger-ui.html");
        info.put("health", "/api/health");
        
        return ResponseEntity.ok(info);
    }

    private long getUptime() {
        return ManagementFactory.getRuntimeMXBean().getUptime() / 1000; // in seconds
    }
}