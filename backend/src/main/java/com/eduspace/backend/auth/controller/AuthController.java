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
        // loginRequest.getEmail() thực tế đang chứa giá trị người dùng gõ vào (có thể là email hoặc username)
        String loginId = loginRequest.getEmail();

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginId,
                        loginRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        // ĐỔI TỪ findByEmail SANG findByEmailOrUsername ĐỂ HỖ TRỢ CẢ 2 HÌNH THỨC
        User user = userRepository.findByEmailOrUsername(loginId, loginId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        if (!user.isActive()) {
            throw new RuntimeException("Tài khoản đã bị khóa!");
        }

        String token = tokenProvider.generateToken(authentication);

        AuthResponse response = AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .build();

        return ResponseEntity.ok(response);
    }
}