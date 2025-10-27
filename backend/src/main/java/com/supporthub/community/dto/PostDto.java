package com.supporthub.community.dto;

import com.supporthub.community.entity.CommunityComment;
import com.supporthub.community.entity.CommunityPost;
import lombok.Builder;

import java.time.Instant;
import java.util.List;

public class PostDto {

    // 글 작성 요청 바디
    // { "emotion": "...", "content": "..." }
    public record CreateRequest(
            String emotion,
            String content
    ) {}

    // 댓글 미리보기
    @Builder
    public record CommentPreview(
            Long id,
            Long userId,
            String content,
            Instant createdAt
    ) {
        public static CommentPreview fromEntity(CommunityComment c) {
            return CommentPreview.builder()
                    .id(c.getId())
                    .userId(c.getUser().getId())      // <- 작성자(user)에서 id
                    .content(c.getContent())
                    .createdAt(c.getCreatedAt())
                    .build();
        }
    }

    // 글 응답
    @Builder
    public record Response(
            Long id,
            Long userId,
            String emotion,
            String content,
            Long likeCount,
            Long commentCount,
            Instant createdAt,
            boolean likedByMe,
            List<CommentPreview> commentsPreview
    ) {
        public static Response fromEntity(
                CommunityPost post,
                boolean likedByMe,
                List<CommunityComment> previewComments
        ) {
            return Response.builder()
                    .id(post.getId())
                    .userId(post.getUser().getId())        // <- 글쓴이 user.id
                    .emotion(post.getEmotion())
                    .content(post.getContent())
                    .likeCount(post.getLikeCount())
                    .commentCount(post.getCommentCount())
                    .createdAt(post.getCreatedAt())
                    .likedByMe(likedByMe)
                    .commentsPreview(
                            previewComments.stream()
                                    .map(CommentPreview::fromEntity)
                                    .toList()
                    )
                    .build();
        }
    }
}
