package com.eduspace.backend.auth.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtTokenProvider {

    // Lấy chuỗi bí mật từ file cấu hình (dùng default nếu chưa có)
    @Value("${app.jwt-secret:eduspace_default_secret_key_must_be_very_long_2026_xyz}")
    private String jwtSecret;

    // Thời gian sống của token (VD: 86400000 ms = 1 ngày)
    @Value("${app.jwt-expiration-milliseconds:86400000}")
    private long jwtExpirationDate;

    // Tạo key mã hóa từ chuỗi bí mật
    private SecretKey key() {
        // Dùng chuẩn HMAC-SHA cho JWT
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    // 1. Tạo JWT Token khi đăng nhập thành công
    public String generateToken(Authentication authentication) {
        String email = authentication.getName();
        Date currentDate = new Date();
        Date expireDate = new Date(currentDate.getTime() + jwtExpirationDate);

        return Jwts.builder()
                .subject(email)
                .issuedAt(currentDate)
                .expiration(expireDate)
                .signWith(key())
                .compact();
    }

    // 2. Lấy Email (subject) từ JWT Token gửi lên
    public String getEmailFromJwt(String token) {
        return Jwts.parser()
                .verifyWith(key())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    // 3. Kiểm tra Token có hợp lệ / hết hạn không
    public boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(key()).build().parseSignedClaims(token);
            return true;
        } catch (MalformedJwtException ex) {
            System.out.println("Token không đúng định dạng");
        } catch (ExpiredJwtException ex) {
            System.out.println("Token đã hết hạn");
        } catch (UnsupportedJwtException ex) {
            System.out.println("Token không được hỗ trợ");
        } catch (IllegalArgumentException ex) {
            System.out.println("Token trống");
        }
        return false;
    }
}
