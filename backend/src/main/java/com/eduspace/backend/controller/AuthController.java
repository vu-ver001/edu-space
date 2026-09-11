package com.eduspace.backend.controller;

import jakarta.validation.Valid;
import com.eduspace.backend.dto.AuthResponse;
import com.eduspace.backend.dto.LoginRequest;
import com.eduspace.backend.dto.UserResponse;
import com.eduspace.backend.entity.User;
import com.eduspace.backend.repository.UserRepository;
import com.eduspace.backend.security.JwtTokenProvider;
import com.eduspace.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final UserService userService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
        // 1. Xác thực tài khoản bằng Spring Security
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getEmail(),
                        loginRequest.getPassword()
                )
        );

        // 2. Lấy thông tin User từ DB để kiểm tra trạng thái và lấy dữ liệu trả về
        User user = userRepository.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        if (!user.isActive()) {
            throw new RuntimeException("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin!");
        }

        // 3. Lưu vào Context và tạo token
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = tokenProvider.generateToken(authentication);

        // 4. Trả token kèm Full thông tin người dùng
        AuthResponse response = AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .build();

        return ResponseEntity.ok(response);
    }

    // API lấy thông tin Profile
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMyProfile(Authentication authentication) {
        UserResponse profile = userService.getProfile(authentication.getName());
        return ResponseEntity.ok(profile);
    }
}