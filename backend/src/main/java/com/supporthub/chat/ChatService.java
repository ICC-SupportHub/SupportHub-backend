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
    private final OpenAIClient openAIClient; // ✅ 모델 호출

    private static final int CONTEXT_WINDOW = 12;
    private static final String MODEL = "gpt-4o-mini";

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
        List<Map<String, Object>> context = buildContext(conv.getId(), req.userMessage());

        // 4) ✅ OpenAI 모델 호출
        String assistant = safeAskModel(MODEL, context);

        // 5) 어시스턴트 메시지 저장
        msgRepo.save(Message.builder()
                .conversation(conv)
                .role(Role.ASSISTANT)
                .content(assistant)
                .build());

        return ChatResponse.of(conv.getId(), assistant);
    }

    private List<Map<String, Object>> buildContext(Long convId, String lastUserMessage) {
        var recent = msgRepo.findTop50ByConversationIdOrderByCreatedAtDesc(convId);
        Collections.reverse(recent); // 시간 오름차순

        List<Map<String, Object>> msgs = new ArrayList<>();
        msgs.add(Map.of("role", "system", "content", SYSTEM_PROMPT));

        int start = Math.max(0, recent.size() - CONTEXT_WINDOW);
        for (int i = start; i < recent.size(); i++) {
            var m = recent.get(i);
            msgs.add(Map.of(
                    "role", m.getRole() == Role.USER ? "user" : "assistant",
                    "content", m.getContent()
            ));
        }
        msgs.add(Map.of("role", "user", "content", lastUserMessage));
        return msgs;
    }

    private String safeAskModel(String model, List<Map<String, Object>> messages) {
        try {
            String result = openAIClient.ask(model, messages).block();
            if (result == null || result.isBlank()) return fallback();
            return result.trim();
        } catch (Exception e) {
            return fallback();
        }
    }

    private String fallback() {
        return "지금 감정을 솔직하게 표현해 주셔서 고마워요. 너무 힘들면 혼자 감당하지 말고, 가까운 사람이나 전문기관에 도움을 요청해 보세요.";
    }

    private String cropTitle(String text) {
        if (text == null) return "새 상담";
        text = text.trim().replaceAll("\\s+", " ");
        return text.length() > 30 ? text.substring(0, 30) + "…" : text;
    }
}
