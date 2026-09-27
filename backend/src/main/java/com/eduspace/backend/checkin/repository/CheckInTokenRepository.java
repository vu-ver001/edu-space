package com.eduspace.backend.checkin.repository;

import com.eduspace.backend.checkin.entity.CheckInToken;
import com.eduspace.backend.checkin.entity.CheckInTokenStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.stereotype.Repository;
import jakarta.persistence.LockModeType;

@Repository
public interface CheckInTokenRepository extends JpaRepository<CheckInToken, Long> {

    /** Locks the active token rows so two concurrent verifications cannot both consume one. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    List<CheckInToken> findByBookingIdAndStatusOrderByIssuedAtDesc(
            Long bookingId,
            CheckInTokenStatus status
    );
}
