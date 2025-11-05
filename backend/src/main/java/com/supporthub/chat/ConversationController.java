package com.supporthub.chat;

import com.supporthub.chat.dto.ChatRequest;
import com.supporthub.chat.dto.ChatResponse;
import com.supporthub.chat.entity.Conversation;
import com.supporthub.chat.entity.Message;
import com.supporthub.chat.repo.ConversationRepository;
import com.supporthub.chat.repo.MessageRepository;
import com.supporthub.user.User;
import com.supporthub.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final ChatService chatService;
    private final ConversationRepository convRepo;
    private final MessageRepository msgRepo;
    private final UserRepository userRepo;

    /** ✅ 모든 대화 삭제 (새 대화 시작용) */
    @DeleteMapping("/reset")
    @Transactional  // ✅ 반드시 추가 — 트랜잭션 안에서 삭제 실행
    public ResponseEntity<Void> resetConversations(Authentication auth) {
        Long userId = getUserId(auth);
        convRepo.deleteAllByUserId(userId);
        return ResponseEntity.noContent().build();
    }

    /** ✅ 특정 대화 메시지 불러오기 */
    @GetMapping("/{conversationId}/messages")
    public ResponseEntity<List<Message>> getMessages(
            @PathVariable Long conversationId,
            Authentication auth
    ) {
        Long userId = getUserId(auth);
        Conversation conv = convRepo.findById(conversationId)
                .filter(c -> c.getUserId().equals(userId))
                .orElseThrow(() ->
                        new IllegalArgumentException("해당 대화가 없거나 접근 권한이 없습니다."));

        List<Message> messages = msgRepo.findByConversationIdOrderByCreatedAtAsc(conversationId);
        return ResponseEntity.ok(messages);
    }

    /** ✅ 새 메시지 전송 (AI 응답 포함) */
    @PostMapping("/{conversationId}/messages")
    public ResponseEntity<ChatResponse> sendMessage(
            @PathVariable Long conversationId,
            @RequestBody ChatRequest req,
            Authentication auth
    ) {
        Long userId = getUserId(auth);
        ChatRequest fixedReq = new ChatRequest(conversationId, req.userMessage(), req.topic());
        ChatResponse res = chatService.replySync(userId, fixedReq);
        return ResponseEntity.ok(res);
    }

    /** ✅ 프론트에서 새 conversation 생성 시 */
    @PostMapping("")
    public ResponseEntity<Conversation> createConversation(
            @RequestBody Conversation conv,
            Authentication auth
    ) {
        Long userId = getUserId(auth);
        conv.setUserId(userId);
        Conversation saved = convRepo.save(conv);
        return ResponseEntity.ok(saved);
    }

    /** ✅ 인증 객체에서 userId 안전하게 추출 */
    private Long getUserId(Authentication auth) {
        Object principal = auth.getPrincipal();

        // 1️⃣ Long 타입일 경우
        if (principal instanceof Long userId) {
            return userId;
        }

        // 2️⃣ 이메일 기반 UserDetails
        if (principal instanceof UserDetails userDetails) {
            String email = userDetails.getUsername();
            return userRepo.findByEmail(email)
                    .map(User::getId)
                    .orElseThrow(() ->
                            new IllegalStateException("userId를 찾을 수 없습니다. email=" + email));
        }

        throw new IllegalStateException("userId 추출 실패: principal=" + principal);
    }
}
