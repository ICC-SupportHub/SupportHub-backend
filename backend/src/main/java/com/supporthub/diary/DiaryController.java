package com.supporthub.diary;

import com.supporthub.diary.dto.ChartStatsResponse;
import com.supporthub.diary.dto.DiaryRequest;
import com.supporthub.diary.dto.DiaryResponse;
import com.supporthub.user.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.*;
import java.util.List;

@RestController
@RequestMapping("/api/diaries")
@RequiredArgsConstructor
public class DiaryController {

    private final DiaryService diaryService;
    private final UserRepository userRepository;

    /** JWT 인증된 현재 사용자 ID 얻기 */
    private Long currentUserId() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null ||
                !(auth.getPrincipal() instanceof org.springframework.security.core.userdetails.User u)) {
            throw new IllegalStateException("인증되지 않은 사용자입니다.");
        }
        String email = u.getUsername();
        return userRepository.findByEmail(email)
                .map(com.supporthub.user.User::getId)
                .orElseThrow(() -> new IllegalStateException("사용자 정보를 찾을 수 없습니다."));
    }

    /** 일기 생성 */
    @PostMapping
    public ResponseEntity<DiaryResponse> create(@Valid @RequestBody DiaryRequest req) {
        Long userId = currentUserId();
        DiaryResponse created = diaryService.create(userId, req);
        return ResponseEntity.ok(created);
    }

    /** 일기 전체 목록 */
    @GetMapping
    public ResponseEntity<List<DiaryResponse>> list() {
        Long userId = currentUserId();
        List<DiaryResponse> items = diaryService.list(userId);
        return ResponseEntity.ok(items);
    }

    /** 일기 상세 */
    @GetMapping("/{id}")
    public ResponseEntity<DiaryResponse> get(@PathVariable Long id) {
        Long userId = currentUserId();
        DiaryResponse one = diaryService.get(userId, id);
        return ResponseEntity.ok(one);
    }

    /** 일기 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<DiaryResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody DiaryRequest req
    ) {
        Long userId = currentUserId();
        DiaryResponse updated = diaryService.update(userId, id, req);
        return ResponseEntity.ok(updated);
    }

    /** 일기 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        Long userId = currentUserId();
        diaryService.delete(userId, id);
        return ResponseEntity.noContent().build();
    }

    /** 감정 통계 (EmotionStatsPage에서 사용) */
    @GetMapping("/stats")
    public ResponseEntity<ChartStatsResponse> getStats(
            @RequestParam(defaultValue = "week") String range
    ) {
        Long userId = currentUserId();
        ZoneId zone = ZoneId.systemDefault();

        Instant now = Instant.now();
        Instant start = "month".equalsIgnoreCase(range)
                ? ZonedDateTime.now(zone).minusMonths(1).toInstant()
                : ZonedDateTime.now(zone).minusDays(7).toInstant();

        ChartStatsResponse response =
                diaryService.getChartStats(userId, start, now, zone);

        return ResponseEntity.ok(response);
    }
}
