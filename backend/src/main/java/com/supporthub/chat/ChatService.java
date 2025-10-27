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

    /** ✅ 주제별 추가 지시문 (클래스 ‘안에’ 있어야 함) */
    private static final Map<String, String> TOPIC_PROMPTS = Map.of(
            "loneliness", "주제: 외로움. 고립감과 연결 욕구를 섬세히 반영해 주세요.",
            "stress", "주제: 스트레스. 부담 경감과 경계 설정, 회복 루틴을 돕는 방향으로 안내해 주세요.",
            "self-criticism", "주제: 자기비난. 자기자비와 현실적 관점 전환을 도와주세요.",
            "depression", "주제: 우울감. 에너지 보존, 작은 행동 활성화, 안전 계획을 중점으로 다뤄주세요.",
            "anxiety", "주제: 불안감. 호흡·그라운딩·불확실성 수용을 돕고 안심시켜 주세요.",
            "general", "주제: 일반 대화. 사용자의 감정을 먼저 반영하고, 파악 질문을 섞어주세요."
    );

    private static final String BASE_SYSTEM_PROMPT = """
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

        // 3) 컨텍스트 구성 (주제 프롬프트 주입)
        List<Map<String, Object>> context = buildContext(conv.getId(), req.userMessage(), req.topic());

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

    private List<Map<String, Object>> buildContext(Long convId, String lastUserMessage, String topic) {
        var recent = msgRepo.findTop50ByConversationIdOrderByCreatedAtDesc(convId);
        Collections.reverse(recent); // 시간 오름차순

        String topicKey = (topic == null || topic.isBlank()) ? "general" : topic;
        String topicPrompt = TOPIC_PROMPTS.getOrDefault(topicKey, TOPIC_PROMPTS.get("general"));

        List<Map<String, Object>> msgs = new ArrayList<>();
        msgs.add(Map.of("role", "system", "content", BASE_SYSTEM_PROMPT + "\n\n" + topicPrompt));

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
