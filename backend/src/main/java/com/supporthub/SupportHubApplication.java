package com.supporthub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.supporthub")
public class SupportHubApplication {
    public static void main(String[] args) {
        SpringApplication.run(SupportHubApplication.class, args);
    }
}
