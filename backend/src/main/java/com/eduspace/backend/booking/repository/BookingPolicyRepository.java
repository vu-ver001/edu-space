package com.eduspace.backend.booking.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

import com.eduspace.backend.booking.entity.BookingPolicy;




@Repository
public interface BookingPolicyRepository extends JpaRepository<BookingPolicy, Long> {
    Optional<BookingPolicy> findByPolicyKey(String policyKey);
}
