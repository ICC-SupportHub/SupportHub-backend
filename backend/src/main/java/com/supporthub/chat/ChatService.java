package com.supporthub.chat;

import com.supporthub.chat.dto.ChatRequest;
import com.supporthub.chat.dto.ChatResponse;
import com.supporthub.chat.entity.Conversation;
import com.supporthub.chat.entity.Message;
import com.supporthub.chat.entity.Message.Role;
import com.supporthub.chat.repo.ConversationRepository;
import com.supporthub.chat.repo.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ConversationRepository convRepo;
    private final MessageRepository msgRepo;

    private static final int CONTEXT_WINDOW = 12;

    private static final String SYSTEM_PROMPT = """
    당신은 공감적인 심리상담 조력자입니다.
    - 진단/치료를 단정적으로 제시하지 말고, 감정을 반영하며 안전한 선택을 돕습니다.
    - 자/타해 위험 신호 시 전문기관·긴급연락을 권고하세요.
    - 한국어로 공감적으로 답하세요.
  """;

    @Transactional
    public ChatResponse replySync(Long userId, ChatRequest req) {
        // 1) 대화방 찾기/생성 (+소유권 확인)
        Conversation conv = (req.conversationId() == null)
                ? convRepo.save(Conversation.builder()
                .userId(userId)
                .title(cropTitle(req.userMessage()))
                .build())
                : convRepo.findById(req.conversationId())
                .filter(c -> Objects.equals(c.getUserId(), userId))
                .orElseThrow(() -> new IllegalArgumentException("conversation not found or not yours"));

        // 2) 사용자 메시지 저장
        msgRepo.save(Message.builder()
                .conversation(conv)
                .role(Role.USER)
                .content(req.userMessage())
                .build());

        // 3) 컨텍스트 구성
        List<Map<String, String>> context = buildContext(conv.getId(), req.userMessage());

        // 4) 모델 호출 (지금은 MOCK)
        String assistant = mockRespond(context);

        // 5) 어시스턴트 메시지 저장
        msgRepo.save(Message.builder()
                .conversation(conv)
                .role(Role.ASSISTANT)
                .content(assistant)
                .build());

        return ChatResponse.of(conv.getId(), assistant);
    }

    private List<Map<String, String>> buildContext(Long convId, String lastUserMessage) {
        var recent = msgRepo.findTop50ByConversationIdOrderByCreatedAtDesc(convId);
        Collections.reverse(recent);

        List<Map<String, String>> msgs = new ArrayList<>();
        msgs.add(Map.of("role","system","content", SYSTEM_PROMPT));

        int start = Math.max(0, recent.size() - CONTEXT_WINDOW);
        for (int i = start; i < recent.size(); i++) {
            var m = recent.get(i);
            msgs.add(Map.of(
                    "role", m.getRole() == Role.USER ? "user" : "assistant",
                    "content", m.getContent()
            ));
        }
        msgs.add(Map.of("role","user","content", lastUserMessage));
        return msgs;
    }

    private String mockRespond(List<Map<String, String>> ctx) {
        String last = ctx.get(ctx.size() - 1).get("content");
        return "✅ [MOCK 응답] \"" + last + "\" 잘 받았어요. 지금은 실제 모델 호출 없이 통신 흐름만 확인 중입니다.";
    }

    private String cropTitle(String text) {
        if (text == null) return "새 상담";
        text = text.trim().replaceAll("\\s+", " ");
        return text.length() > 30 ? text.substring(0, 30) + "…" : text;
    }
}
