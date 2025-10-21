package com.supporthub.auth;

import com.supporthub.auth.dto.AuthResponse;
import com.supporthub.auth.dto.LoginRequest;
import com.supporthub.auth.dto.RegisterRequest;
import com.supporthub.user.User;
import com.supporthub.user.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * ✅ 인증 API 컨트롤러
 * - POST /api/auth/register : 회원가입 + 토큰 발급(자동 로그인)
 * - POST /api/auth/login    : 로그인 + 토큰 발급
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    /**
     * ✅ 회원가입
     * - 성공 시 즉시 로그인 토큰도 함께 반환(UX 편의)
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
        User saved = authService.register(req);
        String token = authService.login(new LoginRequest(req.email(), req.password()));

        return ResponseEntity.ok(
                AuthResponse.of(token, saved.getId(), saved.getEmail(), saved.getNickname(), saved.getRole())
        );
    }

    /**
     * ✅ 로그인
     * - 토큰과 사용자 정보 요약을 반환
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        String token = authService.login(req);
        // 사용자 정보도 응답에 포함(프론트에서 편리)
        User user = userRepository.findByEmail(req.email())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 계정입니다."));

        return ResponseEntity.ok(
                AuthResponse.of(token, user.getId(), user.getEmail(), user.getNickname(), user.getRole())
        );
    }
}
