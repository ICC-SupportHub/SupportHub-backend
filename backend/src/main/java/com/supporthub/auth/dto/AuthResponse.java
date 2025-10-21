package com.supporthub.auth.dto;

/**
 * ✅ 로그인/회원가입 후 클라이언트로 내려줄 인증 응답
 * - accessToken: Bearer 토큰(JWT)
 * - tokenType: 보통 "Bearer"
 * - 사용자 요약 정보 포함
 */
public record AuthResponse(
        String accessToken,
        String tokenType,
        Long userId,
        String email,
        String nickname,
        String role
) {
    public static AuthResponse of(String token, Long id, String email, String nickname, String role) {
        return new AuthResponse(token, "Bearer", id, email, nickname, role);
    }
}
