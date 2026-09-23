package com.eduspace.backend.auth.dto;

import com.eduspace.backend.auth.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UserCreateRequest {
    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    private String email;

    private String password;

    @NotBlank(message = "Họ tên không được để trống")
    private String fullName;

    @NotNull(message = "Vai trò không được để trống")
    private Role role;

    private String username;
    private String dob;
    private String studentId;
    private String department;
}