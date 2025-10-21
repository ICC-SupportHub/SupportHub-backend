package com.supporthub.chat.repo;

import com.supporthub.chat.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findTop50ByConversationIdOrderByCreatedAtDesc(Long conversationId);
}
