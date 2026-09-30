package com.eduspace.backend.auth.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class SecurityUtils {

    // Lấy cục CustomUserDetails chứa mọi thông tin
    public static CustomUserDetails getCurrentUserPrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails) {
            return (CustomUserDetails) authentication.getPrincipal();
        }
        return null;
    }

    // Lấy ID của người đang đăng nhập
    public static Long getCurrentUserId() {
        CustomUserDetails userDetails = getCurrentUserPrincipal();
        return (userDetails != null) ? userDetails.getId() : null;
    }

    // Lấy email của người đang đăng nhập
    public static String getCurrentUserEmail() {
        CustomUserDetails userDetails = getCurrentUserPrincipal();
        if (userDetails != null) {
            return userDetails.getEmail();
        }

        // JWT filter currently uses Spring's standard UserDetails implementation,
        // while service/unit tests commonly use the email as the principal.
        // Both representations must resolve to the same authenticated identity.
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof UserDetails standardUser) {
            return standardUser.getUsername();
        }
        if (principal instanceof String email && !"anonymousUser".equals(email)) {
            return email;
        }
        return null;
    }

    public static String getCurrentUserRole() {
        CustomUserDetails userDetails = getCurrentUserPrincipal();
        if (userDetails != null && !userDetails.getAuthorities().isEmpty()) {
            String role = userDetails.getAuthorities().iterator().next().getAuthority();
            return role.replace("ROLE_", "");
        }
        return null;
    }

    // Lấy Role để check logic nghiệp vụ (nếu cần)
    public static boolean hasRole(String roleName) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }
        return authentication.getAuthorities().stream()
                .anyMatch(grantedAuthority -> grantedAuthority.getAuthority().equals("ROLE_" + roleName));
    }
}
