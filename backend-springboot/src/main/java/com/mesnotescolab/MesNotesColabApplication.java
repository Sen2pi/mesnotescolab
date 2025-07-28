package com.mesnotescolab;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class MesNotesColabApplication {

    public static void main(String[] args) {
        SpringApplication.run(MesNotesColabApplication.class, args);
    }
}