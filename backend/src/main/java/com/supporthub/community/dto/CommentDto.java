package com.supporthub.community.dto;

import com.supporthub.community.entity.CommunityComment;
import lombok.Builder;

import java.time.Instant;

public class CommentDto {

    // 댓글 작성 요청 바디
    // { "content": "..." }
    public record CreateRequest(
            String content
    ) {}

    // 댓글 응답
    @Builder
    public record Response(
            Long id,
            Long userId,
            String content,
            Instant createdAt
    ) {
        public static Response fromEntity(CommunityComment c) {
            return Response.builder()
                    .id(c.getId())
                    .userId(c.getUser().getId())       // <- 댓글 쓴 사람
                    .content(c.getContent())
                    .createdAt(c.getCreatedAt())
                    .build();
        }
    }
}
