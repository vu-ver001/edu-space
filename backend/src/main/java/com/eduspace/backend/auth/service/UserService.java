package com.eduspace.backend.auth.service;

import com.eduspace.backend.auth.dto.UserCreateRequest;
import com.eduspace.backend.auth.dto.UserResponse;
import com.eduspace.backend.auth.entity.Role;
import com.eduspace.backend.auth.entity.User;
import com.eduspace.backend.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private UserResponse mapToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .dob(user.getDob())
                .studentId(user.getStudentId())
                .department(user.getDepartment())
                .active(user.isActive())
                .build();
    }

    // 1. Lấy profile cá nhân
    public UserResponse getProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        return mapToResponse(user);
    }

    // 2. [ADMIN] Lấy danh sách toàn bộ user
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // 3. [ADMIN] Tạo tài khoản mới
    public UserResponse createUser(UserCreateRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email đã tồn tại trong hệ thống");
        }

        // Xử lý tạo mật khẩu tự động chuẩn ngày-tháng-năm (DDMMYYYY)
        String rawPassword = request.getPassword();
        if (rawPassword == null || rawPassword.trim().isEmpty()) {
            if (request.getDob() != null && !request.getDob().isEmpty()) {
                String[] parts = request.getDob().split("-");
                if (parts.length == 3) {
                    rawPassword = parts[2] + parts[1] + parts[0]; // 18052005
                } else {
                    rawPassword = request.getDob().replaceAll("[-/]", "");
                }
            } else {
                rawPassword = "123456"; // Mặc định nếu không có ngày sinh
            }
        }

        // Tự động tạo username nếu request không gửi lên
        String generatedUsername = request.getUsername();
        if (generatedUsername == null || generatedUsername.trim().isEmpty()) {
            if (request.getStudentId() != null && !request.getStudentId().trim().isEmpty()) {
                generatedUsername = request.getStudentId();
            } else {
                generatedUsername = request.getEmail().split("@")[0];
            }
        }

        // Dùng Builder tạo User mới (Đã có đầy đủ dob, studentId, department, username)
        User user = User.builder()
                .email(request.getEmail())
                .username(generatedUsername) // <-- Bổ sung dòng này để không bị null
                .password(passwordEncoder.encode(rawPassword))
                .fullName(request.getFullName())
                .role(request.getRole())
                .dob(request.getDob())                 // Đã có
                .studentId(request.getStudentId())     // Đã có
                .department(request.getDepartment())   // Đã có
                .active(true)
                .build();

        User savedUser = userRepository.save(user);
        return mapToResponse(savedUser);
    }

    // 4. [ADMIN] Khóa / Mở khóa tài khoản
    public UserResponse toggleUserStatus(Long userId, String currentAdminEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        // Logic bảo vệ: Admin không được phép tự khóa chính mình
        if (user.getEmail().equals(currentAdminEmail)) {
            throw new RuntimeException("Lỗi thao tác: Bạn không thể tự khóa tài khoản của chính mình!");
        }

        user.setActive(!user.isActive());
        User updatedUser = userRepository.save(user);
        return mapToResponse(updatedUser);
    }

    // 5. [ADMIN] Thay đổi vai trò người dùng
    public UserResponse changeUserRole(Long userId, Role newRole, String currentAdminEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        // Logic bảo vệ: Admin không được phép tự đổi quyền của chính mình
        if (user.getEmail().equals(currentAdminEmail)) {
            throw new RuntimeException("Lỗi thao tác: Bạn không thể tự thay đổi vai trò của chính mình!");
        }

        user.setRole(newRole);
        User updatedUser = userRepository.save(user);
        return mapToResponse(updatedUser);
    }
}