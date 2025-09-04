package com.supporthub.chat;

import com.supporthub.chat.dto.ChatRequest;
import com.supporthub.chat.dto.ChatResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

/**
 * 심리상담 톤의 system 프롬프트를 부여하고, user 메시지를 Responses API로 전달
 * (지금은 단일 턴. 이후 DB에 messages 저장해서 히스토리 포함해 보내면 됨)
 */
@Service
@RequiredArgsConstructor
public class ChatService {

    private final OpenAIClient openai;

    @Value("${openai.model}")
    private String model;

    public Mono<ChatResponse> reply(ChatRequest req) {
        // system 지침(과도한 의료/진단 금지, 공감/경청, 위기 시 안내 등)을 포함
        var systemPrompt = Map.of(
                "role", "system",
                "content", """
          당신은 공감적인 심리상담 조력자입니다. 
          - 진단/치료를 단정적으로 제시하지 말고, 사용자의 감정을 반영하며 안전한 선택을 돕습니다.
          - 위험 신호(자해, 타인 위해, 학대 정황 등) 포착 시 즉시 전문기관·긴급연락을 권고하세요.
          - 한국 사용자 기준의 표현을 사용하세요.
          """
        );
        var userMsg = Map.of("role", "user", "content", req.userMessage());

        return openai.ask(model, List.of(systemPrompt, userMsg))
                .map(text -> new ChatResponse(req.conversationId(), (text == null || text.isBlank())
                        ? "말씀 고마워요. 지금 상황을 조금 더 구체적으로 알려주실 수 있나요?"
                        : text));
    }
}
