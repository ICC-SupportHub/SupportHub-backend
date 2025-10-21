package com.supporthub.chat.dto;

/** 서버 → 클라이언트 */
public record ChatResponse(
        Long conversationId,
        String assistantMessage
) {
    public static ChatResponse of(Long conversationId, String assistantMessage) {
        return new ChatResponse(conversationId, assistantMessage);
    }
}
