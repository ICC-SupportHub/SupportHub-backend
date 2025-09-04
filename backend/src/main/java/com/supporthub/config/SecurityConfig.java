package com.supporthub.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * ✅ 보안 기본 설정
 * - /api/auth/** 경로는 인증 없이 접근 허용(회원가입/로그인)
 * - 나머지는 인증 필요(임시로 httpBasic 켠 상태 → 추후 JWT 필터로 대체 권장)
 */
@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // API 서버(세션 X)에서 CSRF 비활성화
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                        .anyRequest().authenticated()
                )
                .httpBasic(Customizer.withDefaults()); // ✅ 임시: 브라우저 Basic Auth. JWT 붙이면 제거해도 됨.

        return http.build();
    }

    /**
     * ✅ 비밀번호 해싱용 PasswordEncoder (BCrypt 권장)
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
