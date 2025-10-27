package com.supporthub.community.repository;

import com.supporthub.community.entity.CommunityComment;
import com.supporthub.community.entity.CommunityPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommunityCommentRepository extends JpaRepository<CommunityComment, Long> {

    // 해당 글에 달린 댓글 개수
    @Query("select count(c) from CommunityComment c where c.post.id = :postId")
    long countByPostId(Long postId);

    // 미리보기용 댓글 몇 개 (여기서는 최신 2개만 준다고 가정)
    @Query("""
        select c
        from CommunityComment c
        where c.post.id = :postId
        order by c.createdAt asc
        """)
    List<CommunityComment> findTopByPostIdOrderByCreatedAtAsc(Long postId);

    // 글 지울 때 같이 삭제
    @Modifying
    @Query("delete from CommunityComment c where c.post.id = :postId")
    void deleteByPostId(Long postId);

    List<CommunityComment> findByPost(CommunityPost post);
}
