package com.supporthub.diary;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 프론트에서 emotions[], diaryEntry를 보내면
 * OpenAI를 통해 짧은 피드백을 생성해서 { "feedback": "..." } 로 응답
 */
@RestController
@RequestMapping("/api/diary-feedback")
@RequiredArgsConstructor
public class DiaryFeedbackController {

    private final DiaryFeedbackService feedbackService;

    public record FeedbackReq(List<String> emotions, String diaryEntry) {}

    @PostMapping
    public ResponseEntity<Map<String, String>> feedback(@RequestBody FeedbackReq req) {
        String fb = feedbackService.generateFeedback(req.emotions(), req.diaryEntry());
        return ResponseEntity.ok(Map.of("feedback", fb));
    }
}
