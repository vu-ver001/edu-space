package com.eduspace.backend.policy.repository;

import com.eduspace.backend.policy.entity.BookingPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BookingPolicyRepository extends JpaRepository<BookingPolicy, Long> {

    // Lấy cấu hình chính sách hệ thống hiện hành (thường là bản ghi đầu tiên)
    Optional<BookingPolicy> findTopByOrderByIdAsc();
}
