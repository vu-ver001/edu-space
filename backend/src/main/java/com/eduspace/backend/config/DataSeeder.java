package com.eduspace.backend.config;

import com.eduspace.backend.entity.Role;
import com.eduspace.backend.entity.User;
import com.eduspace.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        // Chỉ bơm data khi bảng users đang trống
        if (userRepository.count() == 0) {
            String defaultPassword = passwordEncoder.encode("123456");

            User admin = new User();
            admin.setEmail("admin@eduspace.vn");
            admin.setPassword(defaultPassword);
            admin.setFullName("Quản Trị Viên");
            admin.setPhoneNumber("0988000111");
            admin.setRole(Role.ADMIN);
            admin.setActive(true);

            User staff = new User();
            staff.setEmail("staff@eduspace.vn");
            staff.setPassword(defaultPassword);
            staff.setFullName("Nhân Viên Quầy");
            staff.setPhoneNumber("0988000222");
            staff.setRole(Role.STAFF);
            staff.setActive(true);

            User student = new User();
            student.setEmail("student@eduspace.vn");
            student.setPassword(defaultPassword);
            student.setFullName("Lê Minh Tân"); // Gắn luôn tên bạn cho oách nhé!
            student.setPhoneNumber("0988000333");
            student.setRole(Role.STUDENT);
            student.setActive(true);

            userRepository.saveAll(List.of(admin, staff, student));
            System.out.println("Đã khởi tạo thành công 3 tài khoản test!");
        }
    }
}