package com.supporthub.diary;

import com.supporthub.diary.dto.ChartStatsResponse;
import com.supporthub.diary.dto.DiaryRequest;
import com.supporthub.diary.dto.DiaryResponse;
import com.supporthub.user.User;
import com.supporthub.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DiaryService {

    private final DiaryRepository diaryRepository;
    private final UserRepository userRepository;

    /* =====================
     * 1. 일기 생성
     * ===================== */
    @Transactional
    public DiaryResponse create(Long userId, DiaryRequest req) {
        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("유저를 찾을 수 없습니다."));

        Diary diary = Diary.builder()
                .user(owner)
                .content(req.content())
                .feedback(req.feedback())
                .emotions(
                        req.emotions() == null
                                ? new ArrayList<>()
                                : new ArrayList<>(req.emotions())
                )
                // createdAt, updatedAt 은 @CreationTimestamp / @UpdateTimestamp 가 자동으로 채움
                .build();

        Diary saved = diaryRepository.save(diary);
        return toResponse(saved);
    }

    /* =====================
     * 2. 일기 목록 조회 (최신순)
     * ===================== */
    @Transactional(readOnly = true)
    public List<DiaryResponse> list(Long userId) {
        List<Diary> diaries = diaryRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return diaries.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /* =====================
     * 3. 단일 일기 조회
     * ===================== */
    @Transactional(readOnly = true)
    public DiaryResponse get(Long userId, Long diaryId) {
        Diary diary = diaryRepository.findById(diaryId)
                .filter(d -> Objects.equals(d.getUser().getId(), userId))
                .orElseThrow(() -> new IllegalArgumentException("일기를 찾을 수 없거나 권한이 없습니다."));
        return toResponse(diary);
    }

    /* =====================
     * 4. 일기 수정
     * ===================== */
    @Transactional
    public DiaryResponse update(Long userId, Long diaryId, DiaryRequest req) {
        Diary diary = diaryRepository.findById(diaryId)
                .filter(d -> Objects.equals(d.getUser().getId(), userId))
                .orElseThrow(() -> new IllegalArgumentException("일기를 찾을 수 없거나 권한이 없습니다."));

        diary.setContent(req.content());
        diary.setFeedback(req.feedback());
        diary.setEmotions(
                req.emotions() == null
                        ? new ArrayList<>()
                        : new ArrayList<>(req.emotions())
        );
        // updatedAt 은 @UpdateTimestamp 가 자동으로 갱신

        Diary saved = diaryRepository.save(diary);
        return toResponse(saved);
    }

    /* =====================
     * 5. 일기 삭제
     * ===================== */
    @Transactional
    public void delete(Long userId, Long diaryId) {
        Diary diary = diaryRepository.findById(diaryId)
                .filter(d -> Objects.equals(d.getUser().getId(), userId))
                .orElseThrow(() -> new IllegalArgumentException("일기를 찾을 수 없거나 권한이 없습니다."));

        diaryRepository.delete(diary);
    }

    /* =====================
     * 6. 감정 통계 (감정 통계 페이지용)
     * ===================== */
    @Transactional(readOnly = true)
    public ChartStatsResponse getChartStats(Long userId, Instant start, Instant end, ZoneId zoneId) {

        List<Diary> diaries = diaryRepository
                .findByUserIdAndCreatedAtBetweenOrderByCreatedAtAsc(userId, start, end);

        // ✅ 데이터가 전혀 없을 때(프론트에서 안전하게 처리 가능하도록 rangeStart/rangeEnd도 채워서 보냄)
        if (diaries.isEmpty()) {
            return new ChartStatsResponse(
                    List.of(),                      // labels
                    List.of(),                      // datasets
                    Map.<String, Long>of(),         // totals(emotionTotals)
                    0L,                             // totalDiaries
                    0L,                             // totalEmotions
                    start,                          // rangeStart
                    end                             // rangeEnd
            );
        }

        // 날짜 -> {감정 -> 카운트}
        Map<LocalDate, Map<String, Long>> byDate = new LinkedHashMap<>();
        Map<String, Long> totals = new HashMap<>();
        long totalEmotions = 0L;

        for (Diary diary : diaries) {
            LocalDate date = LocalDateTime
                    .ofInstant(diary.getCreatedAt(), zoneId)
                    .toLocalDate();

            List<String> emos = diary.getEmotions() != null
                    ? diary.getEmotions()
                    : List.of();

            Map<String, Long> bucket = byDate.computeIfAbsent(date, d -> new HashMap<>());

            for (String raw : emos) {
                if (raw == null) continue;
                String key = raw.trim().toLowerCase();
                if (key.isEmpty()) continue;

                bucket.merge(key, 1L, Long::sum);
                totals.merge(key, 1L, Long::sum);
                totalEmotions++;
            }
        }

        // 프론트 색/라벨 매핑 (EmotionStatsPage와 동일한 키만 우선 지원)
        Map<String, String> colorMap = Map.of(
                "happy",   "#10B981", // 기쁨
                "sad",     "#3B82F6", // 슬픔
                "angry",   "#EF4444", // 화남
                "anxious", "#F59E0B", // 불안
                "neutral", "#6B7280"  // 평온
        );
        Map<String, String> labelMap = Map.of(
                "happy",   "기쁨",
                "sad",     "슬픔",
                "angry",   "화남",
                "anxious", "불안",
                "neutral", "평온"
        );

        // X축 라벨: "10월 23일"
        List<String> labels = byDate.keySet().stream()
                .map(d -> String.format("%d월 %d일", d.getMonthValue(), d.getDayOfMonth()))
                .collect(Collectors.toList());

        // 감정별 데이터셋
        List<ChartStatsResponse.Dataset> datasets = colorMap.keySet()
                .stream()
                .map(emotionKey -> {
                    List<Long> dataPoints = byDate.values().stream()
                            .map(dayMap -> dayMap.getOrDefault(emotionKey, 0L))
                            .collect(Collectors.toList());

                    return new ChartStatsResponse.Dataset(
                            labelMap.getOrDefault(emotionKey, emotionKey),
                            dataPoints,
                            colorMap.getOrDefault(emotionKey, "#6B7280")
                    );
                })
                .collect(Collectors.toList());

        // ✅ 최종 응답
        return new ChartStatsResponse(
                labels,             // labels (x축 날짜 목록)
                datasets,           // datasets (감정별 시계열)
                totals,             // totals (감정별 누적 카운트)
                (long) diaries.size(), // totalDiaries
                totalEmotions,      // totalEmotions
                start,              // rangeStart
                end                 // rangeEnd
        );
    }

    /* =====================
     * 7. Entity → Response DTO
     * ===================== */
    private DiaryResponse toResponse(Diary d) {
        return new DiaryResponse(
                d.getId(),
                d.getUser().getId(),
                d.getEmotions() == null ? List.of() : d.getEmotions(),
                d.getContent(),
                d.getFeedback(),
                d.getCreatedAt(),
                d.getUpdatedAt()
        );
    }
}
