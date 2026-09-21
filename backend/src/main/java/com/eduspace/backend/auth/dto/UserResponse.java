package com.eduspace.backend.auth.dto;

import com.eduspace.backend.auth.entity.Role;
import lombok.Data;

@Data
public class UserResponse {
    private Long id;
    private String email;
    private String fullName;
    private Role role;
    private boolean active;
}