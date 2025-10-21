

package com.supporthub.chat;

import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

/**
 * ✅ MOCK 버전 OpenAIClient
 * - 실제 외부 API 호출을 하지 않고, 더미 문자열을 즉시 반환합니다.
 * - 프론트↔백엔드 통신/흐름 테스트용으로 사용하세요.
 * - 나중에 실서비스 연결 시, 원래 WebClient 버전으로 되돌리면 됩니다.
 */
@Component
public class OpenAIClient {

    /**
     * @param model  - 무시(더미)
     * @param inputMessages - 마지막 user 메시지를 읽어 더미 응답에 반영
     * @return Mono<String> - 즉시 더미 응답 반환
     */
    public Mono<String> ask(String model, List<Map<String, Object>> inputMessages) {
        // 마지막 메시지 content를 읽어 응답에 살짝 넣어줌(테스트 편의)
        String last = "";
        if (inputMessages != null && !inputMessages.isEmpty()) {
            Map<String, Object> lastMsg = inputMessages.get(inputMessages.size() - 1);
            Object content = lastMsg.get("content");
            last = content == null ? "" : content.toString();
        }
        String mock = "✅ [MOCK 응답] \"" + last + "\" 잘 받았어요. "
                + "지금은 실제 모델 호출 없이 통신 흐름만 확인 중입니다.";
        return Mono.just(mock);
    }
}






/*
package com.supporthub.chat;


import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@Component
public class OpenAIClient {
    private final WebClient webClient;

    public OpenAIClient(@Value("${openai.api-url}") String apiUrl,
                        @Value("${openai.api-key}") String apiKey) {
        this.webClient = WebClient.builder()
                .baseUrl(apiUrl)
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .build();
    }

    public Mono<String> ask(String model, List<Map<String, Object>> inputMessages) {
        Map<String, Object> body = Map.of(
                "model", model,
                "input", inputMessages
        );
        return webClient.post()
                .uri("/responses")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Map.class)
                .map(OpenAIClient::extractTextSafe);
    }

    @SuppressWarnings("unchecked")
    private static String extractTextSafe(Map raw) {
        try {
            var out = (List<Map<String,Object>>) raw.get("output");
            if (out != null && !out.isEmpty()) {
                var first = out.get(0);
                var content = (List<Map<String,Object>>) first.get("content");
                if (content != null) {
                    for (var c : content) {
                        if ("output_text".equals(c.get("type"))) {
                            return String.valueOf(c.get("text"));
                        }
                    }
                }
            }
        } catch (Exception ignored) {}
        return "";
    }
}
 */