package com.eduspace.backend.controller;

import com.eduspace.backend.dto.UserCreateRequest;
import com.eduspace.backend.dto.UserResponse;
import com.eduspace.backend.entity.Role;
import com.eduspace.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // Lấy thông tin profile của chính người dùng đang đăng nhập (Ai đã login cũng gọi được)
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMyProfile(Authentication authentication) {
        // authentication.getName() sẽ lấy ra email từ JWT token
        UserResponse profile = userService.getProfile(authentication.getName());
        return ResponseEntity.ok(profile);
    }

    // ==========================================
    // KHU VỰC DÀNH RIÊNG CHO QUẢN TRỊ VIÊN (ADMIN)
    // ==========================================

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody UserCreateRequest request) {
        return ResponseEntity.ok(userService.createUser(request));
    }

    @PatchMapping("/{id}/toggle-status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> toggleUserStatus(@PathVariable Long id, Authentication authentication) {
        String currentAdminEmail = authentication.getName();
        return ResponseEntity.ok(userService.toggleUserStatus(id, currentAdminEmail));
    }

    @PatchMapping("/{id}/change-role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> changeUserRole(
            @PathVariable Long id,
            @RequestParam Role role,
            Authentication authentication) {

        String currentAdminEmail = authentication.getName();
        return ResponseEntity.ok(userService.changeUserRole(id, role, currentAdminEmail));
    }
}