package com.supporthub.chat.safety;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import java.time.Duration;

/**
 * 의미 기반 안전도 추출기:
 * - GPT에 JSON 스키마로 추출 지시
 * - 실패 시 예외 -> 상위에서 룰베이스로 폴백
 */
@Service
@Primary // 이 구현을 우선 사용 (룰베이스는 백업)
public class OpenAISemanticSafetyExtractor implements SafetyExtractor {

    private static final ObjectMapper M = new ObjectMapper();

    @Value("${openai.api.key:}")
    private String apiKey;

    @Value("${openai.model:gpt-4o-mini}")
    private String model;

    private final OkHttpClient http = new OkHttpClient.Builder()
            .callTimeout(Duration.ofSeconds(12))
            .build();

    @Override
    public SafetySignal predict(String text) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("OPENAI_API_KEY not configured");
        }

        // 시스템/유저 프롬프트: JSON 스키마 고정
        String system = """
            너는 한국어 텍스트에서 안전 신호를 구조화해 추출하는 분석기야.
            출력은 반드시 JSON 하나로만. 키:
            {
              "intent": "강함|약함",
              "plan": true|false,
              "means": true|false,
              "time": "즉시|미정",
              "hasProtective": true|false,
              "target": "self|other|none"
            }
            기준:
            - intent: 자해/자살/타해 의사 표명 강도(직접/간접, 명시성, 반복성)
            - plan: 구체적 계획(방법/장소/시간) 언급
            - means: 수단/약물/도구/접근성 언급
            - time: "지금/오늘/곧" 등 임박성 있으면 "즉시", 아니면 "미정"
            - hasProtective: 가족/지지/책임/신념/치료의지 등 보호요인 존재
            - target: 자해/자살이면 self, 타해성 표현/보복이면 other, 없으면 none
        """;

        String user = "분석할 텍스트:\n" + String.valueOf(text);

        String body = """
        {
          "model": "%s",
          "messages": [
            {"role":"system","content": %s},
            {"role":"user","content": %s}
          ],
          "temperature": 0.1
        }
        """.formatted(
                model,
                jsonString(system),
                jsonString(user)
        );

        Request req = new Request.Builder()
                .url("https://api.openai.com/v1/chat/completions")
                .addHeader("Authorization", "Bearer " + apiKey)
                .addHeader("Content-Type", "application/json")
                .post(RequestBody.create(body, MediaType.parse("application/json")))
                .build();

        try (Response res = http.newCall(req).execute()) {
            if (!res.isSuccessful()) {
                throw new RuntimeException("OpenAI error: " + res.code());
            }
            String resBody = res.body() != null ? res.body().string() : "{}";
            JsonNode root = M.readTree(resBody);
            String content = root.path("choices").path(0).path("message").path("content").asText("{}");

            // 모델 응답이 퓨어 JSON이 아닐 수도 있으니 보호적으로 파싱
            JsonNode j = tryParseJson(content);
            String intent = j.path("intent").asText("약함");
            boolean plan = j.path("plan").asBoolean(false);
            boolean means = j.path("means").asBoolean(false);
            String time = j.path("time").asText("미정");
            boolean hasProtective = j.path("hasProtective").asBoolean(false);
            String target = j.path("target").asText("self"); // 기본 self

            return new SafetySignal(intent, plan, means, time, hasProtective, target);
        } catch (Exception e) {
            // 실패는 상위에서 백업 로직으로 처리
            throw new RuntimeException("Semantic extractor failed", e);
        }
    }

    private static String jsonString(String s) {
        try { return M.writeValueAsString(s); }
        catch (Exception e) { return "\"\""; }
    }

    private static JsonNode tryParseJson(String s) {
        try { return M.readTree(s); }
        catch (Exception e) {
            int first = s.indexOf('{'), last = s.lastIndexOf('}');
            if (first >= 0 && last > first) {
                String cand = s.substring(first, last + 1);
                try { return M.readTree(cand); } catch (Exception ignore) {}
            }
            return M.createObjectNode();
        }
    }
}
