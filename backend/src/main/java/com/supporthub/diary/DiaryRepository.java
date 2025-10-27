package com.supporthub.diary;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;

public interface DiaryRepository extends JpaRepository<Diary, Long> {

    /** 통계용: 특정 기간 내 사용자의 일기 목록 (시간 오름차순) */
    @Query("""
        select d
        from Diary d
        where d.user.id = :userId
          and d.createdAt between :start and :end
        order by d.createdAt asc
    """)
    List<Diary> findByUserIdAndCreatedAtBetweenOrderByCreatedAtAsc(
            Long userId,
            Instant start,
            Instant end
    );

    /** 목록용: 특정 사용자의 전체 일기 (최신순) */
    @Query("""
        select d
        from Diary d
        where d.user.id = :userId
        order by d.createdAt desc
    """)
    List<Diary> findByUserIdOrderByCreatedAtDesc(Long userId);
}
