package com.supporthub.chat;

import com.supporthub.chat.dto.ChatRequest;
import com.supporthub.chat.dto.ChatResponse;
import com.supporthub.chat.entity.Conversation;
import com.supporthub.chat.repo.ConversationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping(value = "/api/chat", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final ConversationRepository conversationRepository;

    // 데모/임시용: 인증 붙이면 토큰에서 꺼내세요
    private Long currentUserId() {
        return 1L;
    }

    @GetMapping("/ping")
    public String ping() {
        return "Chat API is alive.";
    }

    /** 대화 생성 (프론트: apiChat.createConversation) */
    @PostMapping("/conversations")
    public Map<String, Object> createConversation(@RequestBody Map<String, Object> body) {
        String title = body != null && body.get("title") != null ? body.get("title").toString() : "새 상담";
        // topic은 대화 엔티티에 저장하지 않아도 ChatService.replySync에서 사용 가능
        Conversation conv = conversationRepository.save(
                Conversation.builder()
                        .userId(currentUserId())
                        .title(title)
                        .build()
        );
        Map<String, Object> res = new HashMap<>();
        res.put("ok", true);
        res.put("id", conv.getId());
        res.put("conversationId", conv.getId());
        return res;
    }

    /** 메시지 전송 (프론트: apiChat.sendMessage) */
    @PostMapping("/conversations/{conversationId}/messages")
    public ChatResponse sendMessage(
            @PathVariable Long conversationId,
            @RequestBody Map<String, Object> body
    ) {
        String userMessage = body != null && body.get("userMessage") != null ? body.get("userMessage").toString() : "";
        String topic = body != null && body.get("topic") != null ? body.get("topic").toString() : "general";

        ChatRequest req = new ChatRequest(conversationId, userMessage, topic);
        // ChatService의 시그니처에 맞춰 호출
        return chatService.replySync(currentUserId(), req);
    }
}
