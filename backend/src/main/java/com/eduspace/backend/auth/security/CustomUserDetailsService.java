package com.eduspace.backend.auth.security;

import com.eduspace.backend.auth.entity.User;
import com.eduspace.backend.auth.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
        // Thay vì chỉ tìm bằng findByEmail, ta dùng findByEmailOrUsername để nhận diện cả 2 trường hợp
        User user = userRepository.findByEmailOrUsername(identifier, identifier)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy tài khoản với định danh: " + identifier));

        // Bắt buộc phải dùng CustomUserDetails để mang theo ID và Role đầy đủ cho toàn hệ thống
        return CustomUserDetails.build(user);
    }
}