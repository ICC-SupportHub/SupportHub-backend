package com.supporthub.diary.dto;

import com.supporthub.diary.Diary;

import java.time.Instant;
import java.util.List;

public record DiaryResponse(
        Long id,
        Long userId,
        List<String> emotions,
        String content,
        String feedback,
        Instant createdAt,
        Instant updatedAt
) {
    // ✅ Diary -> DiaryResponse 변환 헬퍼 (여기서도 userId 포함!)
    public static DiaryResponse from(Diary d) {
        return new DiaryResponse(
                d.getId(),
                d.getUser() != null ? d.getUser().getId() : null,
                d.getEmotions(),
                d.getContent(),
                d.getFeedback(),
                d.getCreatedAt(),
                d.getUpdatedAt()
        );
    }
}
