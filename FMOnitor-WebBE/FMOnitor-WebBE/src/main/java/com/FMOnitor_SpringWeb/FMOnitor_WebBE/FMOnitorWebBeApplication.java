package com.FMOnitor_SpringWeb.FMOnitor_WebBE;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

// @EnableScheduling is required for AccountCleanupScheduler's @Scheduled
// method to ever actually fire - Spring Boot doesn't process @Scheduled
// annotations by default.
@SpringBootApplication
@EnableScheduling
public class FMOnitorWebBeApplication {

	public static void main(String[] args) {
		SpringApplication.run(FMOnitorWebBeApplication.class, args);
	}

}
