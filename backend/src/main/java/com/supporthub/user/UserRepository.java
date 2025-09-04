package com.supporthub.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * ✅ 사용자 조회/저장을 위한 Spring Data JPA 리포지토리
 */
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email); // 로그인 시 사용
    boolean existsByEmail(String email);      // 회원가입 중복체크
}
