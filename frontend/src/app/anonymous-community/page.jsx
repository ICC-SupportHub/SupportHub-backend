'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Heart, MessageCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { apiCommunity } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

function EmotionCircle({ label }) {
  const smallFont = label?.length >= 4
  return (
    <div
      className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-700 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)]"
      aria-label={`감정: ${label}`}
      title={label}
    >
      <span className={smallFont ? 'text-[10px] leading-none' : 'text-xs leading-none'}>
        {label || '...'}
      </span>
    </div>
  )
}

// 상대 시간 계산
function getRelativeTime(isoString) {
  if (!isoString) return ''
  const now = new Date()
  const t = new Date(isoString)
  const diffMin = Math.floor((now - t) / (1000 * 60))
  if (diffMin < 1) return '방금'
  if (diffMin < 60) return `${diffMin}분 전`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}시간 전`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay}일 전`
}

export default function CommunityPage() {
  const { user, token } = useAuth()

  // 서버 sort 파라미터: latest | likes | comments
  const [sortType, setSortType] = useState('latest')
  const [showSortPopup, setShowSortPopup] = useState(false)

  const [selectedEmotion, setSelectedEmotion] = useState(null)
  const [postContent, setPostContent] = useState('')

  const [commentInputs, setCommentInputs] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [posts, setPosts] = useState([])

  const EMOTIONS = ['외로움', '우울', '스트레스', '불안', '분노', '슬픔', '기쁨', '피곤']

  // 목록 로드
  async function loadPosts(currentSort = sortType) {
    try {
      setIsLoading(true)
      const data = await apiCommunity.list({ sort: currentSort })

      const mapped = data.map((p) => ({
        id: p.id,
        emotion: p.emotion,
        content: p.content,
        createdAt: p.createdAt,
        time: getRelativeTime(p.createdAt),

        likes: p.likeCount ?? 0,
        liked: !!p.likedByMe,
        comments: (p.commentsPreview || []).map((c) => ({
          id: c.id,
          text: c.content,
          createdAt: c.createdAt,
          time: getRelativeTime(c.createdAt),
        })),
        commentCount: p.commentCount ?? (p.commentsPreview?.length || 0),

        authorId: p.authorId,
        authorNickname: p.authorNickname || '익명',
      }))

      setPosts(mapped)
    } catch (err) {
      console.error('게시글 목록 불러오기 실패:', err)
      toast.error('게시글을 불러오지 못했어요.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPosts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 글 작성
  async function handleCreatePost() {
    if (!user || !token) {
      toast.error('로그인 후 이용해주세요.')
      return
    }

    const content = postContent.trim()
    if (!content) {
      toast.error('내용을 입력해주세요.')
      return
    }

    try {
      const created = await apiCommunity.createPost({
        emotion: selectedEmotion || '기타',
        content,
      })

      const newPost = {
        id: created.id,
        emotion: created.emotion,
        content: created.content,
        createdAt: created.createdAt,
        time: getRelativeTime(created.createdAt),

        likes: created.likeCount ?? 0,
        liked: !!created.likedByMe,
        comments: [],
        commentCount: created.commentCount ?? 0,

        authorId: created.authorId,
        authorNickname: created.authorNickname || '익명',
      }

      setPosts((prev) => [newPost, ...prev])
      setPostContent('')
      setSelectedEmotion(null)
      toast.success('게시글이 등록되었습니다.')
    } catch (err) {
      console.error('글 작성 실패:', err)
      toast.error('글 작성에 실패했습니다.')
    }
  }

  // 글 삭제 (작성자 본인만)
  async function handleDeletePost(postId, authorId) {
    if (!user || !token) {
      toast.error('로그인 후 이용해주세요.')
      return
    }

    if (user.id !== authorId) {
      toast.error('내가 쓴 글만 삭제할 수 있어요.')
      return
    }

    try {
      await apiCommunity.deletePost(postId)
      setPosts((prev) => prev.filter((p) => p.id !== postId))
      toast.success('게시글이 삭제되었습니다.')
    } catch (err) {
      console.error('게시글 삭제 실패:', err)
      toast.error('삭제에 실패했습니다.')
    }
  }

  // 좋아요 토글
  async function handleLike(postId) {
    if (!user || !token) {
      toast.error('로그인 후 이용해주세요.')
      return
    }

    try {
      const res = await apiCommunity.toggleLike(postId)
      // res: { liked, likeCount }
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, liked: res.liked, likes: res.likeCount }
            : p
        )
      )
    } catch (err) {
      console.error('좋아요 실패:', err)
      toast.error('좋아요 처리 중 문제가 발생했어요.')
    }
  }

  // 댓글 작성 인풋
  function handleCommentChange(postId, value) {
    setCommentInputs((prev) => ({ ...prev, [postId]: value }))
  }

  // 댓글 등록
  async function handleAddComment(postId) {
    if (!user || !token) {
      toast.error('로그인 후 이용해주세요.')
      return
    }

    const text = (commentInputs[postId] || '').trim()
    if (!text) return

    try {
      const created = await apiCommunity.createComment(postId, { content: text })

      const newComment = {
        id: created.id,
        text: created.content,
        createdAt: created.createdAt,
        time: getRelativeTime(created.createdAt),
      }

      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                comments: [...p.comments, newComment],
                commentCount: (p.commentCount || 0) + 1,
              }
            : p
        )
      )

      setCommentInputs((prev) => ({ ...prev, [postId]: '' }))
      toast.success('댓글이 등록되었습니다.')
    } catch (err) {
      console.error('댓글 등록 실패:', err)
      toast.error('댓글 등록에 실패했습니다.')
    }
  }

  // 정렬 변경 (UI 라벨 -> 서버 sort 키)
  async function applySort(humanLabel) {
    const mapToQuery = {
      최신순: 'latest',
      좋아요순: 'likes',
      댓글순: 'comments',
    }
    const q = mapToQuery[humanLabel] || 'latest'
    setShowSortPopup(false)
    setSortType(q)
    await loadPosts(q)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-4 md:px-4 md:py-6">
      {/* 헤더 & 정렬 */}
      <div className="mb-4 flex items-center justify-between md:mb-4">
        <h1 className="text-xl font-semibold md:text-2xl">익명 커뮤니티</h1>
        <div className="relative">
          <Button
            variant="outline"
            onClick={() => setShowSortPopup((v) => !v)}
            className="h-9 min-w-[80px] justify-between text-sm md:h-10 md:min-w-[96px] md:text-sm"
          >
            {sortType === 'likes'
              ? '좋아요순'
              : sortType === 'comments'
              ? '댓글순'
              : '최신순'}
            <span className="ml-1 md:ml-2">▾</span>
          </Button>
          {showSortPopup && (
            <div className="absolute right-0 z-10 mt-2 w-36 rounded-xl border bg-white p-1 shadow">
              {['최신순', '댓글순', '좋아요순'].map((opt) => (
                <button
                  key={opt}
                  onClick={() => applySort(opt)}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-neutral-50"
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 글쓰기 */}
      <Card className="mb-4 md:mb-6">
        <CardHeader className="px-4 pb-2 pt-4 md:px-6 md:pt-6">
          <CardTitle className="text-base md:text-base">감정 나누기</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-4 pb-4 md:px-6 md:pb-6">
          {!user || !token ? (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-700">
              로그인한 사용자만 글을 작성할 수 있어요.
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            {EMOTIONS.map((emo) => (
              <button
                key={emo}
                onClick={() => setSelectedEmotion(emo)}
                disabled={!user || !token}
                className={`rounded-full border px-3 py-1.5 text-sm md:py-1 transition-transform active:scale-95 ${
                  selectedEmotion === emo
                    ? 'border-neutral-800'
                    : 'border-neutral-300'
                } ${!user || !token ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-pressed={selectedEmotion === emo}
              >
                {emo}
              </button>
            ))}
          </div>

          <Textarea
            placeholder={
              user && token
                ? '지금 마음을 적어보세요...'
                : '로그인 후에 마음을 남길 수 있어요.'
            }
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            disabled={!user || !token}
            className="min-h-[100px] text-sm md:min-h-[120px] md:text-base disabled:opacity-50"
          />

          <div className="flex justify-end">
            <Button
              onClick={handleCreatePost}
              disabled={!user || !token}
              className="h-10 px-6 text-sm md:h-10 md:px-6 md:text-base disabled:opacity-50"
            >
              올리기
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 게시글 목록 */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
            <span className="ml-2 text-gray-500">게시글을 불러오는 중...</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-gray-500">아직 게시글이 없습니다.</p>
            <p className="mt-1 text-sm text-gray-400">
              첫 번째 게시글을 작성해보세요!
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <Card key={post.id} className="overflow-hidden">
              <CardHeader className="px-4 pb-2 pt-4 md:px-6 md:pt-6">
                <div className="flex items-start justify-between">
                  {/* 왼쪽: 아바타 + 감정 */}
                  <div className="mt-0.5 flex items-center gap-2 md:gap-3">
                    <Avatar className="h-9 w-9 md:h-10 md:w-10">
                      <AvatarFallback className="text-sm">
                        AN
                      </AvatarFallback>
                    </Avatar>
                    <EmotionCircle label={post.emotion} />
                  </div>

                  {/* 오른쪽: 시간 + (내 글이면 삭제) */}
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-neutral-500 md:text-sm">
                      {post.time}
                    </span>

                    {user && token && user.id === post.authorId ? (
                      <Button
                        variant="ghost"
                        className="h-7 px-2 text-xs text-red-600 hover:text-red-700 md:h-7 md:px-2 md:text-xs"
                        onClick={() => handleDeletePost(post.id, post.authorId)}
                      >
                        삭제하기
                      </Button>
                    ) : null}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 px-4 pb-4 md:px-6 md:pb-6">
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-neutral-800 md:text-[15px]">
                  {post.content}
                </p>

                {/* 좋아요 / 댓글수 */}
                <div className="mt-1 flex items-center gap-4">
                  <button
                    onClick={() => handleLike(post.id)}
                    disabled={!user || !token}
                    className={`flex items-center gap-1 text-sm transition active:scale-95 ${
                      post.liked
                        ? 'text-red-600'
                        : 'text-neutral-600 hover:text-neutral-800'
                    } ${!user || !token ? 'opacity-50 cursor-not-allowed' : ''}`}
                    aria-label="좋아요"
                  >
                    <Heart
                      className={`h-5 w-5 ${post.liked ? 'fill-current' : ''}`}
                      aria-hidden
                    />
                    <span>{post.likes}</span>
                  </button>

                  <div className="flex items-center gap-1 text-sm text-neutral-600">
                    <MessageCircle className="h-5 w-5" aria-hidden />
                    <span>{post.commentCount ?? post.comments.length}</span>
                  </div>
                </div>

                {/* 댓글 목록 프리뷰 */}
                {post.comments.length > 0 && (
                  <div className="mt-2 space-y-2 rounded-lg bg-neutral-50 p-3">
                    {post.comments.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-start justify-between gap-3"
                      >
                        <p className="text-sm text-neutral-800">{c.text}</p>
                        <span className="shrink-0 text-xs text-neutral-500">
                          {c.time}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 댓글 입력 */}
                <div className="flex items-center gap-2">
                  <Input
                    placeholder={
                      user && token
                        ? '댓글을 입력하세요'
                        : '로그인 후 댓글을 작성할 수 있어요'
                    }
                    value={commentInputs[post.id] ?? ''}
                    disabled={!user || !token}
                    onChange={(e) =>
                      handleCommentChange(post.id, e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleAddComment(post.id)
                      }
                    }}
                    className="h-10 text-sm md:h-10 md:text-base disabled:opacity-50"
                  />
                  <Button
                    className="h-10 text-sm md:h-10 md:text-base disabled:opacity-50"
                    disabled={!user || !token}
                    onClick={() => handleAddComment(post.id)}
                  >
                    등록
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
