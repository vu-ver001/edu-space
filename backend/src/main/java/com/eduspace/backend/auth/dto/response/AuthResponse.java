package com.eduspace.backend.auth.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {
    private String token;

    @Builder.Default
    private String tokenType = "Bearer";

<<<<<<< HEAD:backend/src/main/java/com/eduspace/backend/dto/response/AuthResponse.java
    private Long id;
    private String email;
    private String fullName;
    private String role;
}
=======
    public AuthResponse(String token) {
        this.token = token;
    }
}
>>>>>>> 985b04263ab394a1c4462e1dff85a510b3dcfb4e:backend/src/main/java/com/eduspace/backend/auth/dto/response/AuthResponse.java
