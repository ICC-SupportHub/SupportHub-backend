package com.supporthub.chat.repo;

import com.supporthub.chat.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    /** ✅ 특정 대화의 모든 메시지를 시간순(오름차순)으로 조회 */
    List<Message> findByConversationIdOrderByCreatedAtAsc(Long conversationId);

    /** ✅ 최근 50개 메시지를 최신순(내림차순)으로 조회 */
    List<Message> findTop50ByConversationIdOrderByCreatedAtDesc(Long conversationId);
}
