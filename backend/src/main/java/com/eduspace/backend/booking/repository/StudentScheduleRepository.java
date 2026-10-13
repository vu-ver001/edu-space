package com.eduspace.backend.booking.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import com.eduspace.backend.booking.entity.StudentSchedule;

// Repository quản lý truy vấn thời khóa biểu đào tạo chính khóa của sinh viên (Khánh Vân).
@Repository
public interface StudentScheduleRepository extends JpaRepository<StudentSchedule, Long> {

    // Tra cứu các tiết học chính khóa của sinh viên bị trùng lịch trong ngày và khung giờ dự kiến đặt phòng.
    @Query("SELECT ss FROM StudentSchedule ss WHERE ss.studentId = :studentId " +
           "AND ss.scheduleDate = :scheduleDate " +
           "AND ss.startTime < :endTime AND ss.endTime > :startTime")
    List<StudentSchedule> findOverlappingSchedules(
            @Param("studentId") Long studentId,
            @Param("scheduleDate") LocalDate scheduleDate,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime
    );

    // Lấy toàn bộ danh sách lịch học theo mã định danh của sinh viên.
    List<StudentSchedule> findByStudentId(Long studentId);
}
