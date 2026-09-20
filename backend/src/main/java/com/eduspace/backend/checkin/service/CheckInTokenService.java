package com.eduspace.backend.checkin.service;

import com.eduspace.backend.auth.entity.Role;
import com.eduspace.backend.auth.entity.User;
import com.eduspace.backend.auth.repository.UserRepository;
import com.eduspace.backend.auth.security.SecurityUtils;
import com.eduspace.backend.booking.dto.response.BookingResponse;
import com.eduspace.backend.booking.entity.Booking;
import com.eduspace.backend.booking.entity.BookingStatus;
import com.eduspace.backend.booking.repository.BookingRepository;
import com.eduspace.backend.checkin.dto.response.CheckInTokenResponse;
import com.eduspace.backend.checkin.entity.CheckInToken;
import com.eduspace.backend.checkin.entity.CheckInTokenStatus;
import com.eduspace.backend.checkin.repository.CheckInTokenRepository;
import com.eduspace.backend.common.exception.BusinessException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Issues and consumes the one-time credential used by M09 QR/text check-in. */
@Service
@RequiredArgsConstructor
public class CheckInTokenService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final BookingRepository bookingRepository;
    private final CheckInTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final CheckInService checkInService;
    private final Clock checkInClock;

    @Transactional
    public CheckInTokenResponse issue(Long bookingId) {
        User actor = currentActor();
        Booking booking = lockBooking(bookingId);
        authorize(actor, booking);
        requireConfirmed(booking);

        LocalDateTime now = LocalDateTime.now(checkInClock);
        CheckInWindow window = checkInService.getCheckInWindow(booking, now);
        ensureInsideWindow(now, window);

        List<CheckInToken> activeTokens = tokenRepository.findByBookingIdAndStatusOrderByIssuedAtDesc(
                bookingId, CheckInTokenStatus.ACTIVE);
        activeTokens.forEach(token -> token.setStatus(CheckInTokenStatus.EXPIRED));
        tokenRepository.saveAll(activeTokens);

        String rawToken = generateToken();
        CheckInToken token = tokenRepository.save(CheckInToken.builder()
                .bookingId(bookingId)
                .tokenHash(hash(rawToken))
                .issuedAt(now)
                .expiresAt(window.closeAt())
                .status(CheckInTokenStatus.ACTIVE)
                .build());

        return CheckInTokenResponse.builder()
                .bookingId(bookingId)
                .token(rawToken)
                .issuedAt(token.getIssuedAt())
                .expiresAt(token.getExpiresAt())
                .build();
    }

    @Transactional
    public BookingResponse verify(Long bookingId, String rawToken) {
        User actor = currentActor();
        Booking booking = lockBooking(bookingId);
        authorize(actor, booking);

        CheckInToken token = tokenRepository.findByBookingIdAndStatusOrderByIssuedAtDesc(
                        bookingId, CheckInTokenStatus.ACTIVE)
                .stream()
                .findFirst()
                .orElseThrow(this::invalidToken);

        // A consumed token must remain a token error even after the booking moved
        // to CHECKED_IN; this also prevents replay from revealing booking state.
        requireConfirmed(booking);

        LocalDateTime now = LocalDateTime.now(checkInClock);
        CheckInWindow window = checkInService.getCheckInWindow(booking, now);
        if (rawToken == null || rawToken.isBlank()
                || now.isAfter(token.getExpiresAt())
                || now.isBefore(window.openAt())
                || now.isAfter(window.closeAt())
                || !MessageDigest.isEqual(hash(rawToken.trim()).getBytes(StandardCharsets.US_ASCII),
                        token.getTokenHash().getBytes(StandardCharsets.US_ASCII))) {
            throw invalidToken();
        }

        // Marking USED and the shared CHECKED_IN transition happen in one transaction.
        token.setStatus(CheckInTokenStatus.USED);
        token.setUsedAt(now);
        tokenRepository.save(token);
        return checkInService.checkIn(bookingId);
    }

    private Booking lockBooking(Long bookingId) {
        return bookingRepository.findByIdForUpdate(bookingId)
                .orElseThrow(() -> BusinessException.notFound("BOOKING_NOT_FOUND", "Không tìm thấy booking."));
    }

    private User currentActor() {
        String email = SecurityUtils.getCurrentUserEmail();
        if (email == null || "anonymousUser".equals(email)) {
            throw new BusinessException("UNAUTHENTICATED", "Bạn cần đăng nhập.", HttpStatus.UNAUTHORIZED);
        }
        return userRepository.findByEmail(email)
                .filter(User::isActive)
                .orElseThrow(() -> new BusinessException("UNAUTHENTICATED", "Tài khoản không khả dụng.",
                        HttpStatus.UNAUTHORIZED));
    }

    private void authorize(User actor, Booking booking) {
        Role role = actor.getRole();
        if (role != Role.STUDENT && role != Role.STAFF && role != Role.ADMIN) {
            throw BusinessException.forbidden("CHECKIN_FORBIDDEN", "Bạn không có quyền xác minh check-in.");
        }
        if (role == Role.STUDENT && !actor.getId().equals(booking.getStudentId())) {
            throw BusinessException.forbidden("CHECKIN_FORBIDDEN", "Bạn chỉ được xác minh booking của mình.");
        }
    }

    private void requireConfirmed(Booking booking) {
        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw BusinessException.badRequest("INVALID_STATUS_FOR_CHECKIN", "Booking phải ở trạng thái CONFIRMED.");
        }
    }

    private void ensureInsideWindow(LocalDateTime now, CheckInWindow window) {
        if (now.isBefore(window.openAt())) {
            throw BusinessException.badRequest("CHECKIN_TOO_EARLY", "Chưa đến thời gian check-in.");
        }
        if (now.isAfter(window.closeAt())) {
            throw BusinessException.badRequest("CHECKIN_WINDOW_EXPIRED", "Đã quá thời hạn check-in.");
        }
    }

    private BusinessException invalidToken() {
        return BusinessException.conflict("CHECKIN_TOKEN_INVALID", "Mã check-in không hợp lệ hoặc đã hết hạn.");
    }

    private String generateToken() {
        byte[] bytes = new byte[24];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hash(String rawToken) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (java.security.NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is not available", ex);
        }
    }
}
