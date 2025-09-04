package com.supporthub.chat;

import com.supporthub.chat.dto.OpenAIResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import java.util.List;
import java.util.Map;

/**
 * OpenAI Responses API 호출 클라이언트 (단발/비스트리밍)
 * 참고: Responses API 레퍼런스. 스트리밍 가이드도 문서에 정리되어 있음.
 */
@Component
@RequiredArgsConstructor
public class OpenAIClient {
    private final WebClient webClient;

    public OpenAIClient(@Value("${openai.api-url}") String apiUrl,
                        @Value("${openai.api-key}") String apiKey) {
        this.webClient = WebClient.builder()
                .baseUrl(apiUrl)
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .build();
    }

    /**
     * 사용자 메시지를 Responses API에 전달하고, 텍스트 결과 1개를 문자열로 반환
     */
    public Mono<String> ask(String model, List<Map<String, Object>> inputMessages) {
        Map<String, Object> body = Map.of(
                "model", model,
                // Responses API는 input에 "role"/"content" 구조를 허용한다.
                // 여기서는 간단히 단일 user 메시지로 전송.
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
        // 응답 스키마는 계속 확장 중이므로, 가장 단순한 경로를 방어적으로 추출
        // 대략: { output: [ { type: "message", content: [ {type:"output_text", text:"..."} ] } ] }
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
        return ""; // 비어 있으면 상위 레이어에서 기본 응답 처리
    }
}
