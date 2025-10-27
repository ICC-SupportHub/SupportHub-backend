package com.supporthub.chat.dto;

import jakarta.validation.constraints.NotBlank;

/** 클라이언트 → 서버 */
public record ChatRequest(
        Long conversationId,               // 없으면 새 대화 시작
        @NotBlank String userMessage,      // 메시지 본문
        String topic                       // 선택 주제(loneliness/stress/...)
) {}
