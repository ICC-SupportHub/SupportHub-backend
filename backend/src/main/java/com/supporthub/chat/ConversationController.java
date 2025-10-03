package com.supporthub.chat;

import com.supporthub.chat.entity.Conversation;
import com.supporthub.chat.entity.Message;
import com.supporthub.chat.repo.ConversationRepository;
import com.supporthub.chat.repo.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/conversations") @RequiredArgsConstructor
public class ConversationController {
    private final ConversationRepository convRepo; private final MessageRepository msgRepo;

    @GetMapping public List<Conversation> list() {
        Long userId = 1L; // TODO: SecurityContext에서 가져오기
        return convRepo.findByUserIdOrderByUpdatedAtDesc(userId);
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<List<Message>> history(@PathVariable Long id) {
        return ResponseEntity.ok(msgRepo.findTop20ByConversationIdOrderByIdDesc(id));
    }
}
