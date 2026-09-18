package com.eduspace.backend.policy.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

import com.eduspace.backend.policy.entity.BookingPolicy;




@Repository
public interface BookingPolicyRepository extends JpaRepository<BookingPolicy, Long> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("SELECT p FROM BookingPolicy p ORDER BY p.policyKey")
    java.util.List<BookingPolicy> lockAll();

    Optional<BookingPolicy> findByPolicyKey(String policyKey);
}
