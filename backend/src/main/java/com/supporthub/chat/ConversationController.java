package com.supporthub.chat;

import com.supporthub.chat.dto.ChatRequest;
import com.supporthub.chat.dto.ChatResponse;
import com.supporthub.chat.entity.Conversation;
import com.supporthub.chat.entity.Message;
import com.supporthub.chat.repo.ConversationRepository;
import com.supporthub.chat.repo.MessageRepository;
import com.supporthub.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationRepository convRepo;
    private final MessageRepository msgRepo;
    private final UserRepository userRepo;
    private final ChatService chatService;

    /** ✅ JWT 인증 사용자 userId 추출 */
    private Long currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof org.springframework.security.core.userdetails.User user)) {
            throw new IllegalStateException("인증되지 않은 사용자입니다.");
        }
        String email = user.getUsername();
        return userRepo.findByEmail(email)
                .map(u -> u.getId())
                .orElseThrow(() -> new IllegalStateException("사용자 정보를 찾을 수 없습니다."));
    }

    /** ✅ 대화 목록 조회 */
    @GetMapping
    public List<Conversation> list() {
        Long userId = currentUserId();
        return convRepo.findByUserIdOrderByUpdatedAtDesc(userId);
    }

    /** ✅ 메시지 히스토리 (최근 50개, 시간 오름차순) */
    @GetMapping("/{id}/messages")
    public ResponseEntity<List<Message>> history(@PathVariable Long id) {
        var msgs = msgRepo.findTop50ByConversationIdOrderByCreatedAtDesc(id);
        Collections.reverse(msgs);
        return ResponseEntity.ok(msgs);
    }

    /** ✅ 새 대화 생성 */
    public record CreateConversationRequest(String title, String topic) {}

    @PostMapping
    public ResponseEntity<Conversation> create(@RequestBody(required = false) CreateConversationRequest req) {
        Long userId = currentUserId();
        Conversation c = convRepo.save(
                Conversation.builder()
                        .userId(userId)
                        .title(req == null ? "새 상담" : req.title())
                        .build()
        );
        return ResponseEntity.ok(c);
    }

    /**
     * ✅ 메시지 전송 (topic 포함)
     * 프론트엔드 → POST /api/conversations/{id}/messages
     * body: { "userMessage": "...", "topic": "stress" }
     */
    @PostMapping("/{id}/messages")
    public ResponseEntity<ChatResponse> sendMessage(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body
    ) {
        Long userId = currentUserId();
        String userMessage = (String) body.get("userMessage");
        String topic = (String) body.get("topic");

        ChatResponse res = chatService.replySync(userId, new ChatRequest(id, userMessage, topic));
        return ResponseEntity.ok(res);
    }

    /** ✅ 제목 수정 */
    public record UpdateTitleRequest(String title) {}

    @PatchMapping("/{id}")
    public ResponseEntity<Conversation> updateTitle(@PathVariable Long id, @RequestBody UpdateTitleRequest req) {
        Long userId = currentUserId();
        Conversation c = convRepo.findById(id)
                .filter(conv -> conv.getUserId().equals(userId))
                .orElseThrow(() -> new IllegalArgumentException("conversation not found or not yours"));
        c.setTitle(req.title());
        return ResponseEntity.ok(convRepo.save(c));
    }

    /** ✅ 대화 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        Long userId = currentUserId();
        Conversation c = convRepo.findById(id)
                .filter(conv -> conv.getUserId().equals(userId))
                .orElseThrow(() -> new IllegalArgumentException("conversation not found or not yours"));
        convRepo.delete(c);
        return ResponseEntity.noContent().build();
    }
}
