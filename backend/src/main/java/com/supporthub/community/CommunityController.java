package com.supporthub.community;

import com.supporthub.community.dto.CommentDto;
import com.supporthub.community.dto.PostDto;
import com.supporthub.user.User;
import com.supporthub.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/community")
public class CommunityController {

    private final CommunityService communityService;
    private final UserRepository userRepository;

    // principal(=로그인 사용자) -> userId 얻기
    private Long currentUserId(Principal principal) {
        if (principal == null) {
            throw new IllegalStateException("인증이 필요합니다.");
        }
        String email = principal.getName();
        User u = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다."));
        return u.getId();
    }

    // 글 작성
    @PostMapping("/posts")
    public ResponseEntity<PostDto.Response> createPost(
            Principal principal,
            @RequestBody PostDto.CreateRequest req
    ) {
        Long userId = currentUserId(principal);
        PostDto.Response created = communityService.createPost(userId, req);
        return ResponseEntity.ok(created);
    }

    // 글 목록
    @GetMapping("/posts")
    public ResponseEntity<List<PostDto.Response>> listPosts(
            @RequestParam(defaultValue = "latest") String sort
    ) {
        List<PostDto.Response> posts = communityService.listPosts(sort);
        return ResponseEntity.ok(posts);
    }

    // 글 삭제
    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<Void> deletePost(
            Principal principal,
            @PathVariable Long postId
    ) {
        Long userId = currentUserId(principal);
        communityService.deletePost(userId, postId);
        return ResponseEntity.noContent().build();
    }

    // 댓글 작성
    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<CommentDto.Response> createComment(
            Principal principal,
            @PathVariable Long postId,
            @RequestBody CommentDto.CreateRequest req
    ) {
        Long userId = currentUserId(principal);
        CommentDto.Response created = communityService.createComment(userId, postId, req);
        return ResponseEntity.ok(created);
    }

    // 좋아요 토글
    @PostMapping("/posts/{postId}/like-toggle")
    public ResponseEntity<PostDto.Response> toggleLike(
            Principal principal,
            @PathVariable Long postId
    ) {
        Long userId = currentUserId(principal);
        PostDto.Response updated = communityService.toggleLike(userId, postId);
        return ResponseEntity.ok(updated);
    }
}
