package com.eduspace.backend.checkin.service;

import java.time.LocalDateTime;

public record CheckInWindow(LocalDateTime openAt, LocalDateTime closeAt) {
}
