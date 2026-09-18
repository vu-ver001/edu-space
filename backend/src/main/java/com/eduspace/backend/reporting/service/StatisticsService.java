package com.eduspace.backend.reporting.service;

import com.eduspace.backend.reporting.dto.response.DashboardStatisticsResponse;

import java.time.LocalDateTime;

public interface StatisticsService {

    DashboardStatisticsResponse getDashboardStatistics(LocalDateTime from, LocalDateTime to);
}
