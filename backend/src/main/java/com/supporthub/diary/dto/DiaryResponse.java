package com.supporthub.diary.dto;

import com.supporthub.diary.Diary;

import java.time.Instant;
import java.util.List;

public record DiaryResponse(
        Long id,
        List<String> emotions,
        String content,
        String feedback,
        Instant createdAt,
        Instant updatedAt
) {
    public static DiaryResponse from(Diary d) {
        return new DiaryResponse(
                d.getId(),
                d.getEmotions(),
                d.getContent(),
                d.getFeedback(),
                d.getCreatedAt(),
                d.getUpdatedAt()
        );
    }
}
