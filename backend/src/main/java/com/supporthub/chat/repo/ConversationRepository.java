package com.supporthub.chat.repo;

import com.supporthub.chat.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    /** ✅ 사용자별 최근 대화 목록 */
    List<Conversation> findByUserIdOrderByUpdatedAtDesc(Long userId);

    /** ✅ 사용자 전체 대화 삭제 (새 대화용) */
    void deleteAllByUserId(Long userId);
}
