package com.eduspace.backend.checkin.config;

import java.time.Clock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CheckInClockConfiguration {
    @Bean
    public Clock checkInClock() {
        return Clock.systemDefaultZone();
    }
}
