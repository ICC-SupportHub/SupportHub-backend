package com.supporthub.auth;

import com.supporthub.user.User;
import com.supporthub.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SecurityUtil {

    private final UserRepository userRepository;

    public Long currentUserId(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new IllegalStateException("인증 정보가 없습니다.");
        }
        String email;
        Object principal = authentication.getPrincipal();
        if (principal instanceof UserDetails ud) {
            email = ud.getUsername();
        } else if (principal instanceof org.springframework.security.core.userdetails.User u) {
            email = u.getUsername();
        } else if (principal instanceof String s) {
            email = s;
        } else if (principal instanceof User u) {
            return u.getId();
        } else {
            throw new IllegalStateException("지원하지 않는 principal 타입: " + principal.getClass());
        }

        return userRepository.findByEmail(email)
                .map(User::getId)
                .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다: " + email));
    }
}
