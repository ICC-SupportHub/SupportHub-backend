package com.supporthub.user;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * ✅ users 테이블과 매핑되는 JPA 엔티티
 * - 이메일은 유니크 제약
 * - 패스워드는 passwordHash 컬럼에 해싱 값으로 저장
 */
@Entity
@Table(name = "users", uniqueConstraints = {
        @UniqueConstraint(name = "uq_users_email", columnNames = "email")
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class User {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // PK

    @Column(nullable = false, length = 191)
    private String email; // 로그인 ID로 사용할 이메일

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash; // BCrypt 해싱된 비밀번호

    @Column(nullable = false, length = 50)
    private String nickname; // 노출용 닉네임

    @Column(nullable = false, length = 20)
    private String role; // 권한: USER / ADMIN 등

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * ✅ insert 직전에 자동 설정되는 타임스탬프/기본값
     */
    @PrePersist
    void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.role == null) this.role = "USER";
    }

    /**
     * ✅ update 직전에 업데이트 타임 갱신
     */
    @PreUpdate
    void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
