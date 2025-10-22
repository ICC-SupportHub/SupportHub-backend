package com.supporthub.chat;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode; // ✅ Spring 6: HttpStatusCode 사용
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

/**
 * OpenAI Chat Completions 호출 클라이언트
 * - 기본 모델: gpt-4o-mini
 * - 입력: messages(system/user/assistant)
 * - 출력: choices[0].message.content
 */
@Component
@RequiredArgsConstructor
public class OpenAIClient {

    private final WebClient.Builder webClientBuilder;

    /** 환경변수 없을 시 빈 문자열로 기본값 처리 */
    @Value("${openai.apiKey:}")
    private String apiKey;

    /** 기본 baseUrl */
    @Value("${openai.baseUrl:https://api.openai.com/v1}")
    private String baseUrl;

    public Mono<String> ask(String model, List<Map<String, Object>> inputMessages) {
        // ⚡ 안전 가드: 키 누락 시 서버는 뜨되 호출은 차단
        if (apiKey == null || apiKey.isBlank()) {
            return Mono.just("⚠️ OpenAI API KEY가 설정되지 않아 테스트 응답을 반환합니다.");
        }

        WebClient client = webClientBuilder
                .baseUrl(baseUrl)
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .build();

        Map<String, Object> body = Map.of(
                "model", (model == null || model.isBlank()) ? "gpt-4o-mini" : model,
                "temperature", 0.7,
                "messages", inputMessages
        );

        return client.post()
                .uri("/chat/completions")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                // ✅ Spring 6.x: HttpStatusCode::isError (HttpStatus 아님)
                .onStatus(HttpStatusCode::isError, r ->
                        r.bodyToMono(String.class).flatMap(err ->
                                Mono.error(new ResponseStatusException(
                                        r.statusCode(), "OpenAI error: " + err))
                        )
                )
                .bodyToMono(Map.class)
                .map(OpenAIClient::extractMessageText)
                .map(text -> (text == null || text.isBlank()) ? fallback() : text)
                .onErrorReturn(fallback());
    }

    /** choices → message.content 추출 */
    @SuppressWarnings("unchecked")
    private static String extractMessageText(Map<?, ?> raw) {
        try {
            Object choicesObj = raw.get("choices");
            if (!(choicesObj instanceof List<?> choices) || choices.isEmpty()) return null;
            Object first = choices.get(0);
            if (!(first instanceof Map<?, ?> firstMap)) return null;
            Object msgObj = firstMap.get("message");
            if (!(msgObj instanceof Map<?, ?> msg)) return null;
            Object content = msg.get("content");
            return content == null ? null : content.toString();
        } catch (Exception e) {
            return null;
        }
    }

    /** 기본 fallback 응답 */
    private String fallback() {
        return "말해줘서 고마워요. 지금의 감정이 충분히 이해돼요. 잠깐 깊게 호흡하고, 지금 당장 가능한 작은 일 한 가지부터 해볼까요?";
    }
}
