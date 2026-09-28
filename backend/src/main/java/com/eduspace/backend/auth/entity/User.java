package com.eduspace.backend.auth.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 50, unique = true)
    private String username;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(name = "full_name", length = 100)
    private String fullName;

    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "dob", length = 20)
    private String dob;

    @Column(name = "user_code", unique = true)
    private String userCode;

    @Column(name = "department", length = 100)
    private String department;

    @Column(name = "class_name")
    private String className;

    @PrePersist
    @PreUpdate
    public void generateUsername() {
        if (username == null || username.trim().isEmpty()) {
            if (role == Role.STUDENT && userCode != null && !userCode.trim().isEmpty()) {
                this.username = userCode.trim(); // Sinh viên: Dùng Mã SV
            } else if (email != null && email.contains("@")) {
                this.username = email.substring(0, email.indexOf("@")); // Staff/Admin: Dùng tiền tố email
            }
        }
    }
}