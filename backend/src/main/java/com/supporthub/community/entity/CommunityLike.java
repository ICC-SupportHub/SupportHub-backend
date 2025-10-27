package com.supporthub.community.entity;

import com.supporthub.user.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "community_like",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_post_user",
                        columnNames = {"post_id", "user_id"}
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommunityLike {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 어떤 글에 대한 좋아요인지
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "post_id", nullable = false)
    private CommunityPost post;

    // 누가 눌렀는지
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}
