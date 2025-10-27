package com.supporthub.community;

import com.supporthub.community.dto.CommentDto;
import com.supporthub.community.dto.PostDto;
import com.supporthub.community.entity.CommunityComment;
import com.supporthub.community.entity.CommunityLike;
import com.supporthub.community.entity.CommunityPost;
import com.supporthub.community.repository.CommunityCommentRepository;
import com.supporthub.community.repository.CommunityLikeRepository;
import com.supporthub.community.repository.CommunityPostRepository;
import com.supporthub.user.User;
import com.supporthub.user.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CommunityService {

    private final CommunityPostRepository postRepo;
    private final CommunityCommentRepository commentRepo;
    private final CommunityLikeRepository likeRepo;
    private final UserRepository userRepo;

    /* ---------------------------------
     * 유틸: userId로 User 엔티티 가져오기
     * --------------------------------- */
    private User loadUserOrThrow(Long userId) {
        return userRepo.findById(userId)
                .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다."));
    }

    /* ---------------------------------
     * 1) 글 작성
     * --------------------------------- */
    @Transactional
    public PostDto.Response createPost(Long userId, PostDto.CreateRequest req) {
        User author = loadUserOrThrow(userId);

        CommunityPost post = CommunityPost.builder()
                .user(author)
                .emotion(req.emotion() == null ? "기타" : req.emotion())
                .content(req.content())
                .likeCount(0L)
                .commentCount(0L)
                .build();

        CommunityPost saved = postRepo.save(post);

        // 새 글이니까 내가 좋아요 눌렀을 리 없음, 댓글도 없음
        return PostDto.Response.fromEntity(
                saved,
                false,
                List.of()
        );
    }

    /* ---------------------------------
     * 2) 글 목록 조회 (정렬)
     * sort: latest | likes | comments
     * --------------------------------- */
    @Transactional
    public List<PostDto.Response> listPosts(String sort) {
        List<CommunityPost> posts;

        switch (sort) {
            case "likes" -> posts = postRepo.findAllOrderByLikeCountDesc();
            case "comments" -> posts = postRepo.findAllOrderByCommentCountDesc();
            default -> posts = postRepo.findAllOrderByCreatedAtDesc();
        }

        // 각 글마다 댓글 미리보기(앞부분 조금), likedByMe=false (익명 목록이라 일단 false)
        return posts.stream()
                .map(p -> {
                    // 댓글 프리뷰용으로 전체를 다 줄 수도 있고, 상위 일부만 줄 수도 있음
                    List<CommunityComment> previewComments =
                            commentRepo.findTopByPostIdOrderByCreatedAtAsc(p.getId());

                    boolean likedByMe = false; // 목록에서는 사용자 컨텍스트가 없으니 false로 둠
                    return PostDto.Response.fromEntity(
                            p,
                            likedByMe,
                            previewComments
                    );
                })
                .toList();
    }

    /* ---------------------------------
     * 내부 유틸: 글 소유자 맞는지 검사하고 가져오기
     * --------------------------------- */
    private CommunityPost loadPostOrThrow(Long postId) {
        return postRepo.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
    }

    /* ---------------------------------
     * 3) 글 삭제
     * - 본인 글만 삭제 가능하도록 체크
     * --------------------------------- */
    @Transactional
    public void deletePost(Long userId, Long postId) {
        CommunityPost post = loadPostOrThrow(postId);

        if (!post.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("본인이 작성한 글만 삭제할 수 있습니다.");
        }

        // 댓글 / 좋아요 먼저 정리
        likeRepo.deleteByPostId(postId);
        commentRepo.deleteByPostId(postId);

        postRepo.delete(post);
    }

    /* ---------------------------------
     * 4) 댓글 작성
     * --------------------------------- */
    @Transactional
    public CommentDto.Response createComment(
            Long userId,
            Long postId,
            CommentDto.CreateRequest req
    ) {
        User author = loadUserOrThrow(userId);
        CommunityPost post = loadPostOrThrow(postId);

        CommunityComment comment = CommunityComment.builder()
                .post(post)
                .user(author)
                .content(req.content())
                .build();

        CommunityComment saved = commentRepo.save(comment);

        // 댓글 수 증가
        long newCount = commentRepo.countByPostId(postId);
        post.setCommentCount(newCount);
        postRepo.save(post);

        return CommentDto.Response.fromEntity(saved);
    }

    /* ---------------------------------
     * 5) 좋아요 토글
     * return: { likedByMe, likeCount, ... } (우린 PostDto.Response로 맞춰줌)
     * --------------------------------- */
    @Transactional
    public PostDto.Response toggleLike(Long userId, Long postId) {
        User me = loadUserOrThrow(userId);
        CommunityPost post = loadPostOrThrow(postId);

        var existing = likeRepo.findByPostIdAndUserId(postId, userId);

        boolean nowLiked;
        if (existing.isPresent()) {
            // 이미 눌렀으면 취소
            likeRepo.delete(existing.get());
            nowLiked = false;
        } else {
            // 안 눌렀으면 추가
            CommunityLike like = CommunityLike.builder()
                    .post(post)
                    .user(me)
                    .build();
            likeRepo.save(like);
            nowLiked = true;
        }

        long newLikeCount = likeRepo.countByPostId(postId);
        post.setLikeCount(newLikeCount);
        postRepo.save(post);

        // 댓글 프리뷰 가져오기 (그냥 일관성 유지 차원)
        List<CommunityComment> previewComments =
                commentRepo.findTopByPostIdOrderByCreatedAtAsc(postId);

        return PostDto.Response.fromEntity(
                post,
                nowLiked,
                previewComments
        );
    }
}
