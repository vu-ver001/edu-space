package com.eduspace.backend.dto;

import com.eduspace.backend.entity.Role;
import lombok.Data;

@Data
public class UserResponse {
    private Long id;
    private String email;
    private String fullName;
    private Role role;
    private boolean active;
}