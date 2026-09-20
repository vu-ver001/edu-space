package com.eduspace.backend.auth.controller;

import jakarta.validation.Valid;
import com.eduspace.backend.auth.dto.response.AuthResponse;
import com.eduspace.backend.auth.dto.request.LoginRequest;
import com.eduspace.backend.auth.entity.User;
import com.eduspace.backend.auth.repository.UserRepository;
import com.eduspace.backend.auth.security.JwtTokenProvider;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;

    public AuthController(AuthenticationManager authenticationManager,
                          JwtTokenProvider tokenProvider,
                          UserRepository userRepository) {
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.userRepository = userRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getEmail(),
                        loginRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        // Lấy thông tin User từ DB
        User user = userRepository.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        if (!user.isActive()) {
            throw new RuntimeException("Tài khoản đã bị khóa!");
        }

        String token = tokenProvider.generateToken(authentication);

        // Trả về AuthResponse có đầy đủ thông tin
        AuthResponse response = AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name()) // Đảm bảo trả về "STAFF", "ADMIN" hoặc "STUDENT"
                .build();

        return ResponseEntity.ok(response);
    }
}