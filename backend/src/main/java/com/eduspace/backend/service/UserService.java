package com.eduspace.backend.service;

import com.eduspace.backend.dto.UserCreateRequest;
import com.eduspace.backend.dto.UserResponse;
import com.eduspace.backend.entity.Role;
import com.eduspace.backend.entity.User;
import com.eduspace.backend.repository.UserRepository;
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

    // Chuyển đổi Entity sang DTO
    private UserResponse mapToResponse(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setEmail(user.getEmail());
        response.setFullName(user.getFullName());
        response.setRole(user.getRole());
        response.setActive(user.isActive());
        return response;
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
            throw new RuntimeException("Email đã tồn tại trong hệ thống"); // Sẽ được GlobalExceptionHandler bắt nếu cấu hình thêm
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword())); // Mã hóa mật khẩu
        user.setFullName(request.getFullName());
        user.setRole(request.getRole());
        user.setActive(true);

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