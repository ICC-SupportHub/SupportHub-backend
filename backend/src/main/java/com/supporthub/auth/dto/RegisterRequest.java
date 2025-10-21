package com.supporthub.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * ✅ 회원가입 요청 DTO
 * - Bean Validation으로 서버단 입력 검증
 */
public record RegisterRequest(
        @Email @NotBlank String email,             // 이메일 형식 + 빈 값 금지
        @Size(min = 8, max = 64) String password, // 최소 8자 권장(대문자/특수문자 검증은 커스텀으로 추가 가능)
        @NotBlank @Size(max = 50) String nickname  // 길이 제한
) {}
