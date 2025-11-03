package com.supporthub.chat.dto;

public record ChatResponse(
        boolean ok,
        Long conversationId,
        String reply
) {
    public static ChatResponse of(Long conversationId, String reply) {
        return new ChatResponse(true, conversationId, reply);
    }
}
