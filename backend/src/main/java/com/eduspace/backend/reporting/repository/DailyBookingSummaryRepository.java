package com.eduspace.backend.reporting.repository;

import com.eduspace.backend.reporting.entity.DailyBookingSummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DailyBookingSummaryRepository extends JpaRepository<DailyBookingSummary, Long> {

    Optional<DailyBookingSummary> findByStatDate(LocalDate statDate);

    List<DailyBookingSummary> findByStatDateBetweenOrderByStatDateAsc(LocalDate startDate, LocalDate endDate);

    @Query("SELECT MIN(d.statDate) FROM DailyBookingSummary d")
    LocalDate findEarliestStatDate();

    @Query("SELECT MAX(d.calculatedAt) FROM DailyBookingSummary d")
    LocalDateTime findLatestCalculatedAt();
}
