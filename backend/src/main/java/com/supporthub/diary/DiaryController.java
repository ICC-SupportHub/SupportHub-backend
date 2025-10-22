package com.supporthub.diary;

import com.supporthub.diary.dto.DiaryRequest;
import com.supporthub.diary.dto.DiaryResponse;
import com.supporthub.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/diaries")
@RequiredArgsConstructor
public class DiaryController {

    private final DiaryService diaryService;
    private final UserRepository userRepository;

    private Long currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof org.springframework.security.core.userdetails.User user)) {
            throw new IllegalStateException("unauthenticated");
        }
        String email = user.getUsername();
        return userRepository.findByEmail(email)
                .map(u -> u.getId())
                .orElseThrow(() -> new IllegalStateException("user not found"));
    }

    @GetMapping
    public List<DiaryResponse> list() {
        Long userId = currentUserId();
        return diaryService.list(userId).stream()
                .map(DiaryResponse::from)
                .toList();
    }

    @PostMapping
    public ResponseEntity<DiaryResponse> create(@RequestBody DiaryRequest req) {
        Long userId = currentUserId();
        var saved = diaryService.create(userId, req.emotions(), req.content(), req.feedback());
        return ResponseEntity.ok(DiaryResponse.from(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DiaryResponse> update(@PathVariable Long id, @RequestBody DiaryRequest req) {
        Long userId = currentUserId();
        var updated = diaryService.update(userId, id, req.emotions(), req.content(), req.feedback());
        return ResponseEntity.ok(DiaryResponse.from(updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        Long userId = currentUserId();
        diaryService.delete(userId, id);
        return ResponseEntity.noContent().build();
    }
}
