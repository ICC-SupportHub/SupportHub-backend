package com.supporthub.auth;

import com.supporthub.auth.dto.AuthResponse;
import com.supporthub.auth.dto.LoginRequest;
import com.supporthub.auth.dto.RegisterRequest;
import com.supporthub.user.User;
import com.supporthub.user.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    private static final String COOKIE_NAME = "access_token";

    /** 회원가입: 저장 → 바로 로그인 토큰 발급(UX 편의) */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
        User saved = authService.register(req);
        String token = authService.login(new LoginRequest(req.email(), req.password()));

        ResponseCookie cookie = buildAuthCookie(token, false); // dev: secure=false
        AuthResponse body = AuthResponse.of(token, saved.getId(), saved.getEmail(), saved.getNickname(), saved.getRole());

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(body);
    }

    /** 로그인: 토큰 발급 + 쿠키 설정 */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        String token = authService.login(req);

        // 사용자 정보 포함해서 응답
        User user = userRepository.findByEmail(req.email())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 계정입니다."));

        ResponseCookie cookie = buildAuthCookie(token, false); // prod 배포시 true 로
        AuthResponse body = AuthResponse.of(token, user.getId(), user.getEmail(), user.getNickname(), user.getRole());

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(body);
    }

    /** 현재 로그인 정보 (프론트 초기 진입 시 세션 확인용) */
    @GetMapping("/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal UserDetails principal) {
        if (principal == null) {
            // SecurityConfig의 AuthenticationEntryPoint가 401 JSON으로 처리하지만,
            // 여기서도 방어적으로 401 내려도 됨.
            return ResponseEntity.status(401).body(java.util.Map.of("error", "unauthorized"));
        }
        // 필요한 최소 정보만 반환
        return ResponseEntity.ok(java.util.Map.of("email", principal.getUsername()));
    }

    /** 로그아웃: 쿠키 즉시 만료 */
    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        ResponseCookie cookie = ResponseCookie.from(COOKIE_NAME, "")
                .httpOnly(true)
                .secure(false)           // prod: true
                .sameSite("Lax")         // cross-site 필요 시 "None" + secure=true
                .path("/")
                .maxAge(0)               // 즉시 만료
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(java.util.Map.of("ok", true));
    }

    /** 공통: 인증 쿠키 빌더 */
    private ResponseCookie buildAuthCookie(String token, boolean secure) {
        return ResponseCookie.from(COOKIE_NAME, token)
                .httpOnly(true)
                .secure(secure)          // ✅ 로컬 개발: false / 배포(HTTPS): true
                .sameSite("Lax")         // ✅ cross-site 필요하면 "None" 으로 바꾸고 위 secure=true
                .path("/")
                .maxAge(Duration.ofDays(7))
                .build();
    }
}
