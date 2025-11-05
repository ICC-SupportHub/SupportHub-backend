package com.supporthub.chat.safety;

/** 안전 신호 추출 결과(기존 Extracted와 동일 역할) */
public record SafetySignal(
        String intent,          // "강함" | "약함" | ...
        boolean plan,
        boolean means,
        String time,            // "즉시" | "미정" | ...
        boolean hasProtective,
        String target           // "self" | "other" | "none"
) {}
