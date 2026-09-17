package com.eduspace.backend.auth.controller;

import jakarta.validation.Valid;
import com.eduspace.backend.auth.dto.response.AuthResponse;
import com.eduspace.backend.auth.dto.request.LoginRequest;
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

    public AuthController(AuthenticationManager authenticationManager, JwtTokenProvider tokenProvider) {
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
        // 1. Xác thực tài khoản bằng Spring Security
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getEmail(),
                        loginRequest.getPassword()
                )
        );

        // 2. Lưu vào Context
        SecurityContextHolder.getContext().setAuthentication(authentication);

        // 3. Tạo token bằng JwtTokenProvider
        String token = tokenProvider.generateToken(authentication);

        // 4. Trả token về cho Frontend
        return ResponseEntity.ok(new AuthResponse(token));
    }
}
