package com.supporthub.chat;

import com.supporthub.auth.AuthUser;
import com.supporthub.chat.dto.ChatRequest;
import com.supporthub.chat.dto.ChatResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping(value="/messages",
            consumes=MediaType.APPLICATION_JSON_VALUE,
            produces=MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ChatResponse> send(Authentication auth,
                                             @Valid @RequestBody ChatRequest req) {
        Long userId = 1L; // fallback
        if (auth != null && auth.getPrincipal() instanceof AuthUser au) {
            userId = au.id();
        }
        return ResponseEntity.ok(chatService.replySync(userId, req));
    }
}
