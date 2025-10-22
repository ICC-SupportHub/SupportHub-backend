package com.supporthub.diary.dto;

import java.util.List;

public record DiaryRequest(
        List<String> emotions,
        String content,
        String feedback
) {}
