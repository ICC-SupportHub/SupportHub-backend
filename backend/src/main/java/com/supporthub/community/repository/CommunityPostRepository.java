package com.supporthub.community.repository;

import com.supporthub.community.entity.CommunityPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommunityPostRepository extends JpaRepository<CommunityPost, Long> {

    // 최신순
    @Query("select p from CommunityPost p order by p.createdAt desc")
    List<CommunityPost> findAllOrderByCreatedAtDesc();

    // 좋아요순
    @Query("select p from CommunityPost p order by p.likeCount desc, p.createdAt desc")
    List<CommunityPost> findAllOrderByLikeCountDesc();

    // 댓글순
    @Query("select p from CommunityPost p order by p.commentCount desc, p.createdAt desc")
    List<CommunityPost> findAllOrderByCommentCountDesc();
}
