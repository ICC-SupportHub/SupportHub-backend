package com.supporthub.diary;

import com.supporthub.user.User;
import com.supporthub.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DiaryService {

    private final DiaryRepository diaryRepository;
    private final UserRepository userRepository;

    @Transactional
    public Diary create(Long userId, List<String> emotions, String content, String feedback) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("user not found"));

        Diary diary = Diary.builder()
                .user(user)
                .emotions(emotions)
                .content(content)
                .feedback(feedback)
                .build();

        return diaryRepository.save(diary);
    }

    @Transactional(readOnly = true)
    public List<Diary> list(Long userId) {
        return diaryRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public Diary update(Long userId, Long diaryId, List<String> emotions, String content, String feedback) {
        Diary d = diaryRepository.findById(diaryId)
                .orElseThrow(() -> new IllegalArgumentException("diary not found"));
        if (!d.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("not your diary");
        }
        if (emotions != null) d.setEmotions(emotions);
        if (content != null) d.setContent(content);
        if (feedback != null) d.setFeedback(feedback);
        return d;
    }

    @Transactional
    public void delete(Long userId, Long diaryId) {
        Diary d = diaryRepository.findById(diaryId)
                .orElseThrow(() -> new IllegalArgumentException("diary not found"));
        if (!d.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("not your diary");
        }
        diaryRepository.delete(d);
    }
}
