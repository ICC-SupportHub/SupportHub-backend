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
import java.util.regex.Pattern;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * SupportHub 상담형 AI - 사양충족 + 안정성 보강 버전
 * - JSON 형식 강제: 파싱 기반 검증/정규화(길이 컷, 위기 문구 보강, 최소 키 채우기)
 * - 마크다운/코드펜스 제거 후 첫 번째 JSON 블록만 추출
 * - 모델 JSON 실패 시 수리 프롬프트로 1회 재시도 → 실패하면 안전 JSON 반환
 * - 위기 키워드 1차 룰베이스 탐지 → safety_level "crisis" 승격 및 연락처/동행 문구 보강
 */
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ConversationRepository convRepo;
    private final MessageRepository msgRepo;
    private final OpenAIClient openAIClient;

    private static final int CONTEXT_WINDOW = 12;
    private static final String MODEL = "gpt-4o-mini";

    /** Jackson */
    private static final ObjectMapper MAPPER = new ObjectMapper();

    /** reply 길이 가드(가독성) */
    private static final int MAX_REPLY_CHARS = 800;

    /** 위기 신호(룰베이스 1차) */
    private static final Pattern CRISIS_HINT = Pattern.compile(
            "(죽고\\s*싶|끝내고\\s*싶|극단적\\s*선택|극단선택|자살|자해|해치고\\s*싶|해치겠|스스로\\s*해치|과다\\s*복용|" +
                    "칼|밧줄|유서|뛰어내리|목숨|살기\\s*싫|존재를\\s*없애|사라지고\\s*싶|수면제|kill\\s*myself|suicide)",
            Pattern.CASE_INSENSITIVE
    );

    /** 도움 연락처 상수 */
    private static final String HOTLINES = "한국 도움 연락처: 112(긴급), 119(응급), 1393(자살예방 상담), 129(복지상담)";

    /** 주제별 세부 지시문 */
    private static final Map<String, String> TOPIC_PROMPTS = Map.of(
            "loneliness", "주제: 외로움 — 소속감·연결 욕구를 존중하며 ‘미시적 연결 행동’을 함께 설계해 주세요. " +
                    "정서 반영과 정상화 → 방해요인 탐색 → 구체적 연결 행동(언제/어디/얼마나) → 장벽 B-plan.",
            "stress", "주제: 스트레스 — 부담 경감·경계 설정·회복 루틴 중심. " +
                    "Brief PST / I-statement 경계 설정 / 90초 호흡–5분 브레이크–25분 몰입 중 1개.",
            "self-criticism", "주제: 자기비난 — 자기자비(친절·공유 인간성·마음챙김) + CBT식 증거/대안 문장 1개.",
            "depression", "주제: 우울 — 에너지 보존·행동활성화(BA)·안전계획. " +
                    "‘즐거움 vs 성취’ 매트릭스에서 1개 행동, 3분 호흡공간(MBCT), 위험 시 Safety Plan.",
            "anxiety", "주제: 불안 — 느린 호흡(4-2-6)·그라운딩·불확실성 수용/미세 노출 중 1개.",
            "general", "주제: 일반 — 감정 파악·가치 탐색·목표 명료화 후 적절한 마이크로 개입 제안 + ‘다음 한 걸음’ 합의."
    );

    /** 시스템 프롬프트(요구사항 + JSON 강제 + 길이/스타일 가드 + few-shot 요약) */
    private static final String BASE_SYSTEM_PROMPT = """
        당신은 한국 사용자를 돕는 “정서적 공감 + 근거기반(EBP) 마이크로-개입” 상담형 AI입니다.
        의료진이 아니며 진단/약물/법률 결정은 하지 않습니다. 위기 시 즉시 안전계획과 도움요청을 우선합니다.

        [대화 원칙]
        • 공감 → 정리 → 미세 목표 → 근거기반 제안 → 합의 요약(5단계)
        • 치료적 관계(Alliance) 최우선: 사용자의 감정·가치·맥락 반영, 속도는 사용자가 정함
        • 근거기반: CBT/ACT/MBCT/MI, IPT, DBT의 짧은 스킬만 제안
        • 금지: 병명 단정, 위험한 의학 조언, 법률/재정 확정 지시, 트리거 유도
        • 한국어로, 문장 3~5개/불릿 최대 5개, 이모지 0~1개/문장. 과장 금지. 사용자 톤을 따름

        [안전/크라이시스]
        • 자해/자살/가해/학대/응급의학 신호 탐지 시 “crisis”로 표기하고,
          (1) 공감 1문장 → (2) 즉시 연락처(112/119/1393/129 등) → (3) Safety Plan 6단계 중 1~2단계를 함께 작성
          (“지금 1단계부터 같이 적어봐요…”) 형식으로 안내

        [출력 형식(JSON만 출력, 텍스트·마크다운 금지)]
        {
          "reply": "사용자에게 보일 3~5문장/불릿 텍스트",
          "next_questions": ["짧은 후속 질문 1~2개"],
          "skill_tag": "CBT | ACT | MBCT | MI | DBT | IPT | Alliance",
          "suggestions": ["선택지 A","선택지 B"],
          "diary_suggested": true | false,
          "safety_level": "ok | check-in | crisis",
          "meta_notes": "대화 요약/가설(사용자 비표시)"
        }

        [few-shot 요약 가이드]
        • 스트레스: 과업 세분화/15분 타이머 + 성취점수
        • 불안: 4-2-6 호흡 30~90초 + 5감각 그라운딩
        • IPT 갈등: '사실-느낌-요구' 1문장 연습
        • 크라이시스: 안전 최우선, 즉시 연락처 + 1~2단계 Safety Plan 동행
    """;

    /** JSON 수리 지시(재시도용) */
    private static final String JSON_REPAIR_PROMPT = """
        위 응답을 지정 JSON 스키마에 정확히 맞게 다시 출력하세요.
        - JSON 외의 텍스트/마크다운/설명 금지
        - 필수 키 전부 포함: reply, next_questions, skill_tag, suggestions, diary_suggested, safety_level, meta_notes
    """;

    @Transactional
    public ChatResponse replySync(Long userId, ChatRequest req) {
        // 1) 대화방 생성/조회
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

        // 3) 컨텍스트 생성
        List<Map<String, Object>> context = buildContext(conv.getId(), req.userMessage(), req.topic());

        // 4) 모델 호출(1차)
        String raw = safeAskModel(MODEL, context);

        // 5) JSON 검증/수리/정규화(위기 보강 포함)
        String json = ensureJson(raw, context, req.userMessage());

        // 6) 어시스턴트 메시지 저장(JSON 문자열 그대로 보관)
        msgRepo.save(Message.builder()
                .conversation(conv)
                .role(Role.ASSISTANT)
                .content(json)
                .build());

        // 7) 응답
        return ChatResponse.of(conv.getId(), json);
    }

    /** 컨텍스트: system(BASE+topic) + 최근 대화(CONTEXT_WINDOW) + 마지막 user */
    private List<Map<String, Object>> buildContext(Long convId, String lastUserMessage, String topic) {
        var recent = msgRepo.findTop50ByConversationIdOrderByCreatedAtDesc(convId);
        Collections.reverse(recent);

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

    /** 모델 호출 래퍼 (가능하면 JSON 모드 옵션을 OpenAIClient에 확장해 전달 권장) */
    private String safeAskModel(String model, List<Map<String, Object>> messages) {
        try {
            String result = openAIClient.ask(model, messages).block();
            if (result == null || result.isBlank()) return minimalSafeJson();
            return result.trim();
        } catch (Exception e) {
            return minimalSafeJson();
        }
    }

    /** JSON 보장: 파싱 실패 시 1회 수리 → 실패 시 안전 JSON. 이후 정규화(길이/위기 보강 등) */
    private String ensureJson(String raw, List<Map<String, Object>> baseContext, String userMsg) {
        if (isValidJsonPayload(raw)) return normalizePayload(raw, userMsg);

        // 수리 재시도
        List<Map<String, Object>> repairCtx = new ArrayList<>(baseContext);
        repairCtx.add(Map.of("role", "system", "content", JSON_REPAIR_PROMPT));
        String repaired = safeAskModel(MODEL, repairCtx);

        if (isValidJsonPayload(repaired)) {
            return normalizePayload(repaired, userMsg);
        }
        return minimalSafeJson();
    }

    /** 안전 최소 JSON (fallback) */
    private String minimalSafeJson() {
        return """
        {
          "reply": "지금 마음을 나눠 주셔서 고마워요. 우선 숨을 한 번 고르고, 가장 부담이 덜한 한 걸음부터 같이 정해볼까요?",
          "next_questions": ["지금 가장 도와드리면 좋은 건 정리/행동/안정 중 무엇일까요?"],
          "skill_tag": "Alliance",
          "suggestions": ["30초 호흡 후 가장 쉬운 일 1개만 10분 시작", "느낌을 한 줄로 기록하기"],
          "diary_suggested": true,
          "safety_level": "check-in",
          "meta_notes": "fallback safe response"
        }
        """;
    }

    /** 코드펜스/마크다운 제거 + 첫 번째 JSON 오브젝트만 추출 */
    private String extractFirstJsonObject(String s) {
        if (s == null) return null;
        // ```json / ``` 제거
        s = s.replaceAll("(?s)```+\\s*json\\s*", "")
                .replaceAll("(?s)```+", "")
                .trim();
        int start = s.indexOf('{');
        if (start < 0) return s;
        int depth = 0;
        for (int i = start; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == '{') depth++;
            else if (c == '}') {
                depth--;
                if (depth == 0) {
                    return s.substring(start, i + 1);
                }
            }
        }
        return s;
    }

    /** JSON 유효성 검사(파싱 기반, 필수 키 존재 여부 확인) */
    private boolean isValidJsonPayload(String raw) {
        try {
            String json = extractFirstJsonObject(raw);
            JsonNode root = MAPPER.readTree(json);
            return root.hasNonNull("reply")
                    && root.has("next_questions")
                    && root.hasNonNull("skill_tag")
                    && root.has("suggestions")
                    && root.hasNonNull("diary_suggested")
                    && root.hasNonNull("safety_level")
                    && root.has("meta_notes");
        } catch (Exception e) {
            return false;
        }
    }

    /** JSON 정규화: 길이 컷, 위기 승격/연락처 보강, 최소 키 보장, 리스트 최소값 보강 */
    private String normalizePayload(String raw, String userMsg) {
        try {
            String json = extractFirstJsonObject(raw);
            JsonNode root = MAPPER.readTree(json);

            // reply 길이 컷
            String reply = root.path("reply").asText("");
            if (reply.length() > MAX_REPLY_CHARS) {
                reply = reply.substring(0, MAX_REPLY_CHARS) + "…";
            }

            // safety_level: 룰베이스 위기어휘 발견 시 승격
            String safety = root.path("safety_level").asText("ok");
            if (CRISIS_HINT.matcher(String.valueOf(userMsg)).find()) {
                safety = "crisis";
            }

            // crisis 최소 안내문 보강(연락처 + Safety Plan 동행 문구)
            if ("crisis".equals(safety)) {
                if (!reply.contains("112") && !reply.contains("1393")) {
                    reply = "당신의 안전이 가장 중요해요. " + HOTLINES
                            + " 로 즉시 연락해 주세요. 원하시면 지금 같이 Safety Plan 1단계부터 적어봐요.\n\n"
                            + reply;
                }
            }

            // suggestions 수집 (재할당 없이 add만 사용)
            List<String> suggestions = new ArrayList<>();
            for (JsonNode n : root.path("suggestions")) {
                suggestions.add(n.asText());
            }
            if (suggestions.isEmpty()) {
                suggestions.add("30초 호흡해보기");
                suggestions.add("가장 쉬운 일 1개만 10분 시작");
            }

            // next_questions 수집 (재할당 없이 add만 사용)
            List<String> nextQs = new ArrayList<>();
            for (JsonNode n : root.path("next_questions")) {
                nextQs.add(n.asText());
            }
            if (nextQs.isEmpty()) {
                nextQs.add("지금 가장 도와드리면 좋은 건 정리/행동/안정 중 무엇일까요?");
            }

            // 최종 JSON 재구성(타입 안전)
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("reply", reply);
            out.put("next_questions", nextQs);
            out.put("skill_tag", root.path("skill_tag").asText("Alliance"));
            out.put("suggestions", suggestions);
            out.put("diary_suggested", root.path("diary_suggested").asBoolean(true));
            out.put("safety_level", safety);
            out.put("meta_notes", root.path("meta_notes").asText("normalized"));

            return MAPPER.writeValueAsString(out);

        } catch (Exception e) {
            return minimalSafeJson();
        }
    }

    /** 제목 자동 생성 */
    private String cropTitle(String text) {
        if (text == null) return "새 상담";
        text = text.trim().replaceAll("\\s+", " ");
        return text.length() > 30 ? text.substring(0, 30) + "…" : text;
    }

    /** 사용자 전체 대화 삭제 */
    @Transactional
    public void deleteAllConversationsByUserId(Long userId) {
        convRepo.deleteAllByUserId(userId);
    }
}
