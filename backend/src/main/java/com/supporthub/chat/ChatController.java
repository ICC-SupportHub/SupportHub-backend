package com.supporthub.chat;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * ChatController는 이제 OpenAI 테스트나 단순 상태 확인용만 남깁니다.
 * 기존 /api/conversations/** 관련 POST/GET 메서드는 모두 제거되었습니다.
 */
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    // 단순 헬스체크 or AI 테스트용 엔드포인트 (선택)
    @GetMapping("/ping")
    public String ping() {
        return "Chat API is alive.";
    }

}
