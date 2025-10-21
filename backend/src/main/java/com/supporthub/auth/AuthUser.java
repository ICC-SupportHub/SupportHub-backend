package com.supporthub.auth;

import java.io.Serial;
import java.io.Serializable;
import java.security.Principal;
import java.util.Collection;
import java.util.Collections;
import java.util.Objects;

/**
 * 최소 구현 AuthUser
 * - 컴파일 통과 및 간단한 주체 정보 전달용
 * - 실제 인증 연동(Spring Security/JWT 등)은 추후 Security 설정에서 주입
 */
public class AuthUser implements Principal, Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    private final Long id;                  // 내부 식별자
    private final String username;          // 표시명
    private final String email;             // 이메일
    private final Collection<String> roles; // 간단한 권한 목록

    public AuthUser(Long id, String username, String email, Collection<String> roles) {
        this.id = id;
        this.username = username != null ? username : (email != null ? email : "anonymous");
        this.email = email;
        this.roles = roles != null ? roles : Collections.emptyList();
    }

    /** 편의 생성자 (id 없이) */
    public AuthUser(String username, String email) {
        this(null, username, email, null);
    }

    /** 익명 사용자 */
    public static AuthUser anonymous() {
        return new AuthUser(null, "anonymous", null, Collections.emptyList());
    }

    // ---- getters ----
    public Long getId() {
        return id;
    }

    /** record 스타일과의 호환을 위한 alias (요청하신 메서드) */
    public Long id() {
        return getId();
    }

    public String getUsername() {
        return username;
    }

    public String username() { // 필요 시 record 스타일 alias
        return getUsername();
    }

    public String getEmail() {
        return email;
    }

    public String email() { // 필요 시 record 스타일 alias
        return getEmail();
    }

    public Collection<String> getRoles() {
        return roles;
    }

    public Collection<String> roles() { // 필요 시 record 스타일 alias
        return getRoles();
    }

    // Principal 구현
    @Override
    public String getName() {
        return getUsername();
    }

    // equals/hashCode/toString
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof AuthUser that)) return false;
        return Objects.equals(id, that.id)
                && Objects.equals(username, that.username)
                && Objects.equals(email, that.email);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, username, email);
    }

    @Override
    public String toString() {
        return "AuthUser{id=%s, username='%s', email='%s', roles=%s}"
                .formatted(id, username, email, roles);
    }
}
