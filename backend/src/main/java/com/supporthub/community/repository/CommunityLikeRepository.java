package com.supporthub.community.repository;

import com.supporthub.community.entity.CommunityLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CommunityLikeRepository extends JpaRepository<CommunityLike, Long> {

    // 이 유저가 이 글에 눌렀는지 체크
    @Query("""
        select l
        from CommunityLike l
        where l.post.id = :postId
          and l.user.id = :userId
        """)
    Optional<CommunityLike> findByPostIdAndUserId(Long postId, Long userId);

    // 글 좋아요 전체 개수
    @Query("select count(l) from CommunityLike l where l.post.id = :postId")
    long countByPostId(Long postId);

    // 글 삭제 시 좋아요들 삭제
    @Modifying
    @Query("delete from CommunityLike l where l.post.id = :postId")
    void deleteByPostId(Long postId);
}
