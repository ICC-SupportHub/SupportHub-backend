package com.supporthub.user;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @GetMapping("/me")
    public Map<String, Object> me(Authentication authentication) {
        // 인증 안 되어 있으면 null
        if (authentication == null || authentication.getPrincipal() == null) {
            return Map.of("authenticated", false, "principal", "anonymous");
        }
        String email = authentication.getName();
        return Map.of(
                "authenticated", true,
                "email", email
                // 필요 시 userId/role은 토큰 클레임에서 꺼내거나 DB 조회로 추가
        );
    }
}
