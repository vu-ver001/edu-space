package com.eduspace.backend.common.controller;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Skeleton endpoint kiem tra service song.
 * FE goi GET /health de xac nhan noi duoc BE (VITE_API_URL).
 */
@RestController
public class HealthController {

	@GetMapping("/health")
	public Map<String, String> health() {
		return Map.of("status", "OK");
	}
}
