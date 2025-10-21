package com.supporthub.auth;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Instant;
import java.util.Date;
import java.util.Map;

/**
 * ✅ JWT 발급 유틸
 * - HS256 서명 사용 (대칭키)
 * - subject: userId, claims: email/role
 */
@Component
public class JwtProvider {

    private final Key key;            // 서명용 비밀키
    private final String issuer;      // 토큰 발급자 식별자(검증 시 사용)
    private final long expirySeconds; // 만료시간(초)

    public JwtProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.issuer}") String issuer,
            @Value("${jwt.expiry-seconds}") long expirySeconds
    ) {
        // ⚠ secret 길이가 짧으면 Keys.hmacShaKeyFor 에서 예외 발생 가능 → 충분히 긴 문자열 사용
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.issuer = issuer;
        this.expirySeconds = expirySeconds;
    }

    /**
     * ✅ 사용자 정보로 서명된 JWT 발급
     */
    public String generateToken(Long userId, String email, String role) {
        Instant now = Instant.now();
        Instant exp = now.plusSeconds(expirySeconds);

        return Jwts.builder()
                .setIssuer(issuer)                  // 발급자
                .setSubject(String.valueOf(userId)) // 주체(여기선 userId)
                .addClaims(Map.of(                  // 부가 클레임
                        "email", email,
                        "role", role
                ))
                .setIssuedAt(Date.from(now))        // 발급 시각
                .setExpiration(Date.from(exp))      // 만료 시각
                .signWith(key, SignatureAlgorithm.HS256) // HS256 서명
                .compact();
    }
}
