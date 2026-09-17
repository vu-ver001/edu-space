package com.eduspace.backend.auth.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final CustomUserDetailsService customUserDetailsService;

    public JwtAuthenticationFilter(JwtTokenProvider tokenProvider, CustomUserDetailsService customUserDetailsService) {
        this.tokenProvider = tokenProvider;
        this.customUserDetailsService = customUserDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            // Lấy token từ header của request
            String jwt = getJwtFromRequest(request);

            // Nếu token hợp lệ, cho phép đi tiếp vào Controller
            if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {

                // Giải mã lấy email
                String email = tokenProvider.getEmailFromJwt(jwt);

                // Load thông tin user (kèm theo Role) từ database
                UserDetails userDetails = customUserDetailsService.loadUserByUsername(email);
                if (!userDetails.isEnabled() || !userDetails.isAccountNonLocked()) {
                    throw new org.springframework.security.authentication.DisabledException("Tài khoản không khả dụng");
                }

                // Báo cho Spring Security biết là "Người này hợp lệ, cho vào!"
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception ex) {
            SecurityContextHolder.clearContext();
            System.out.println("Lỗi xác thực user trong filter: " + ex.getMessage());
        }

        // Chuyển request cho các filter tiếp theo
        filterChain.doFilter(request, response);
    }

    // Hàm tiện ích để cắt bỏ chữ "Bearer " ở đầu token
    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
