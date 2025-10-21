package com.supporthub.chat.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
@Entity
@Table(name = "message",
        indexes = {
                @Index(name = "idx_msg_conv", columnList = "conversation_id"),
                @Index(name = "idx_msg_created", columnList = "created_at")
        })
public class Message {

    public enum Role { USER, ASSISTANT }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Role role;

    @Lob
    private String content;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
