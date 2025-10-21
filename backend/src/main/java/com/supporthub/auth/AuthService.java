package com.supporthub.auth;

import com.supporthub.auth.dto.LoginRequest;
import com.supporthub.auth.dto.RegisterRequest;
import com.supporthub.user.User;
import com.supporthub.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * ✅ 회원가입/로그인 도메인 로직
 * - 비밀번호는 반드시 해싱하여 저장/검증
 * - 로그인 성공 시 JWT 발급
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;

    /**
     * ✅ 회원가입
     * - 이메일 중복 체크 → 비밀번호 해싱 → 저장
     */
    public User register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            // 실서비스에선 커스텀 예외 + 글로벌 예외처리로 409(CONFLICT) 등 매핑 권장
            throw new IllegalArgumentException("이미 가입된 이메일입니다.");
        }
        User user = User.builder()
                .email(req.email())
                .passwordHash(passwordEncoder.encode(req.password())) // 해싱 저장
                .nickname(req.nickname())
                .role("USER")
                .build();
        return userRepository.save(user);
    }

    /**
     * ✅ 로그인
     * - 이메일로 사용자 조회 → 비밀번호 매칭 → JWT 발급
     */
    public String login(LoginRequest req) {
        User user = userRepository.findByEmail(req.email())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 계정입니다."));

        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }
        return jwtProvider.generateToken(user.getId(), user.getEmail(), user.getRole());
    }
}
