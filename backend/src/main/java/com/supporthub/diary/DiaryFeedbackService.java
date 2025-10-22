package com.supporthub.diary;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

/**
 * OpenAI Chat Completions로 간단한 한국어 피드백 생성
 * - 모델: gpt-4o-mini (경량/저비용)
 * - 2~3문장, 공감/하루에 적용 가능한 1가지 팁
 */
@Service
@RequiredArgsConstructor
public class DiaryFeedbackService {

    private final WebClient openAiWebClient; // @Qualifier("openAiWebClient") 생략 (빈 이름 일치)

    public String generateFeedback(List<String> emotions, String diaryEntry) {
        String emo = (emotions == null || emotions.isEmpty())
                ? "none"
                : String.join(", ", emotions);

        String system = """
                You are a warm, concise mental-wellness coach for a Korean user.
                - Reply in Korean.
                - Keep it within 2-3 short sentences.
                - Be empathetic and include exactly one practical tip the user can try today.
                - Do not diagnose; if a crisis is suggested, gently recommend professional help.
                """;

        String user = """
                감정: %s
                일기: %s
                위 조건으로 한국어 피드백을 간단히 작성하세요.
                """.formatted(emo, diaryEntry == null ? "" : diaryEntry);

        // Chat Completions 요청 바디
        Map<String, Object> body = Map.of(
                "model", "gpt-4o-mini",
                "temperature", 0.7,
                "messages", List.of(
                        Map.of("role", "system", "content", system),
                        Map.of("role", "user", "content", user)
                )
        );

        try {
            Map<String, Object> resp = openAiWebClient.post()
                    .uri("/chat/completions")
                    .bodyValue(body)
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, r ->
                            r.bodyToMono(String.class).flatMap(err ->
                                    Mono.error(new ResponseStatusException(r.statusCode(), "OpenAI error: " + err))
                            )
                    )
                    .bodyToMono(Map.class)
                    .block();

            // choices[0].message.content 추출
            if (resp == null) return fallbackText();
            Object choicesObj = resp.get("choices");
            if (!(choicesObj instanceof List<?> choices) || choices.isEmpty()) return fallbackText();
            Object first = choices.get(0);
            if (!(first instanceof Map<?, ?> firstMap)) return fallbackText();
            Object messageObj = firstMap.get("message");
            if (!(messageObj instanceof Map<?, ?> msg)) return fallbackText();
            Object contentObj = msg.get("content");
            String text = contentObj == null ? null : contentObj.toString().trim();
            return (text == null || text.isBlank()) ? fallbackText() : text;

        } catch (Exception e) {
            // 예외 시 안전한 기본 멘트
            return fallbackText();
        }
    }

    private String fallbackText() {
        return "오늘의 감정을 잘 기록하셨어요. 잠시 깊게 호흡하고, 지금 할 수 있는 아주 작은 한 가지를 실천해 보세요.";
    }
}
