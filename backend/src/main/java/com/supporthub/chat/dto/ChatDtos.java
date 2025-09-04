package com.supporthub.chat.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

/** 사용자 → 서버 */
public record ChatRequest(
        Long conversationId,                 // 대화방 식별(없으면 새로 생성해도 됨)
        @NotBlank String userMessage         // 사용자가 입력한 문장
) {}

/** 서버 → 프론트 */
public record ChatResponse(
        Long conversationId,
        String assistantMessage
) {}

/** 내부 Responses API 응답 파싱용(필요 최소 필드만) */
public record OpenAIText(String type, String text) {}
public record OpenAIOutput(List<OpenAIText> output) {}
public record OpenAIResponse(List<OpenAIOutput> response) {}
