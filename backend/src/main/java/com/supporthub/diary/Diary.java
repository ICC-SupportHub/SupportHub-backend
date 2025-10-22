package com.supporthub.diary;

import com.supporthub.user.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "diary") // ✅ DB 테이블 이름 명시
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Diary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 작성자
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id") // DB 컬럼명 user_id
    private User user;

    // 감정 배열을 별도 테이블에 저장
    @ElementCollection
    @CollectionTable(name = "diary_emotion", joinColumns = @JoinColumn(name = "diary_id"))
    @Column(name = "emotion")
    @Builder.Default
    private List<String> emotions = new ArrayList<>();

    @Column(columnDefinition = "LONGTEXT")
    private String content;

    @Column(columnDefinition = "LONGTEXT")
    private String feedback;

    @CreationTimestamp
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;
}
