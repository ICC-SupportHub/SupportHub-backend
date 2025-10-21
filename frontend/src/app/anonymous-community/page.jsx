'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Heart, MessageCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

function EmotionCircle({ label }) {
  const smallFont = label.length >= 4
  return (
    <div
      className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-700 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)]"
      aria-label={`감정: ${label}`}
      title={label}
    >
      <span
        className={
          smallFont ? 'text-[10px] leading-none' : 'text-xs leading-none'
        }
      >
        {label}
      </span>
    </div>
  )
}

export default function Page() {
  const [sortType, setSortType] = useState('최신순')
  const [showSortPopup, setShowSortPopup] = useState(false)
  const [selectedEmotion, setSelectedEmotion] = useState(null)
  const [postContent, setPostContent] = useState('')
  const [commentInputs, setCommentInputs] = useState({})
  const [isLoading, setIsLoading] = useState(true)

  const EMOTIONS = [
    '외로움',
    '우울',
    '스트레스',
    '불안',
    '분노',
    '슬픔',
    '기쁨',
    '피곤',
  ]

  // 기본 샘플 데이터
  const defaultPosts = [
    {
      id: 1,
      emotion: '외로움',
      time: '6시간 전',
      content: '친구들과의 약속이 취소돼서 하루 종일 혼자였어요.',
      likes: 15,
      liked: false,
      comments: [{ id: 'c1', text: '같이 힘내요!', time: '1시간 전' }],
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 2,
      emotion: '우울',
      time: '2시간 전',
      content: '오늘 하필 중요한 일에 실수를 했어요. 너무 다운되네요.',
      likes: 13,
      liked: false,
      comments: [],
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 3,
      emotion: '스트레스',
      time: '5시간 전',
      content: '시험 기간이라 잠을 잘 못자요. 마음이 조급해요.',
      likes: 0,
      liked: false,
      comments: [],
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
  ]

  const [posts, setPosts] = useState([])

  // 상대적 시간 계산
  const getRelativeTime = (createdAt) => {
    const now = new Date()
    const postTime = new Date(createdAt)
    const diffInMinutes = Math.floor((now - postTime) / (1000 * 60))

    if (diffInMinutes < 1) return '방금'
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}시간 전`
    return `${Math.floor(diffInMinutes / 1440)}일 전`
  }

  // localStorage에 데이터 저장
  const savePostsToStorage = (postsToSave) => {
    try {
      // localStorage 사용 가능 여부 확인
      if (typeof window === 'undefined' || !window.localStorage) {
        console.log('localStorage를 사용할 수 없어서 저장하지 않음')
        return
      }

      console.log('게시글 저장 시도:', postsToSave)
      localStorage.setItem('community-posts', JSON.stringify(postsToSave))
      console.log('게시글 저장 완료')
    } catch (error) {
      console.error('게시글 저장 실패:', error)
      toast.error('게시글 저장에 실패했습니다.')
    }
  }

  // localStorage에서 데이터 로드
  useEffect(() => {
    const loadPosts = () => {
      try {
        // localStorage 사용 가능 여부 확인
        if (typeof window === 'undefined' || !window.localStorage) {
          console.log('localStorage를 사용할 수 없음')
          setPosts(defaultPosts)
          setIsLoading(false)
          return
        }

        const savedPosts = localStorage.getItem('community-posts')
        console.log('저장된 게시글 데이터:', savedPosts)
        console.log('localStorage 키들:', Object.keys(localStorage))

        if (savedPosts && savedPosts !== 'null' && savedPosts !== 'undefined') {
          const parsedPosts = JSON.parse(savedPosts)
          console.log('파싱된 게시글 데이터:', parsedPosts)

          // 시간 업데이트
          const updatedPosts = parsedPosts.map((post) => ({
            ...post,
            time: getRelativeTime(post.createdAt),
          }))
          console.log('시간 업데이트된 게시글:', updatedPosts)
          setPosts(updatedPosts)
        } else {
          console.log('저장된 데이터가 없음, 기본 데이터 사용')
          // 기본 데이터 저장
          setPosts(defaultPosts)
          savePostsToStorage(defaultPosts)
        }
      } catch (error) {
        console.error('게시글 로드 실패:', error)
        toast.error('게시글을 불러오는데 실패했습니다.')
        setPosts(defaultPosts)
      } finally {
        setIsLoading(false)
      }
    }

    loadPosts()
  }, [])

  // 좋아요 토글
  const handleLike = (postId) => {
    setPosts((prev) => {
      const updatedPosts = prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              liked: !p.liked,
              likes: !p.liked ? p.likes + 1 : Math.max(0, p.likes - 1),
            }
          : p
      )
      savePostsToStorage(updatedPosts)
      return updatedPosts
    })
  }

  // 댓글 입력 변경
  const handleCommentChange = (postId, value) => {
    setCommentInputs((prev) => ({ ...prev, [postId]: value }))
  }

  // 댓글 추가
  const handleAddComment = (postId) => {
    const text = (commentInputs[postId] || '').trim()
    if (!text) return

    const newComment = {
      id: `${postId}-${Date.now()}`,
      text,
      time: '방금',
      createdAt: new Date().toISOString(),
    }

    setPosts((prev) => {
      const updatedPosts = prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              comments: [...p.comments, newComment],
            }
          : p
      )
      savePostsToStorage(updatedPosts)
      return updatedPosts
    })
    setCommentInputs((prev) => ({ ...prev, [postId]: '' }))
    toast.success('댓글이 등록되었습니다.')
  }

  // 게시글 삭제(카드 오른쪽 상단)
  const handleDeletePost = (postId) => {
    setPosts((prev) => {
      const updatedPosts = prev.filter((p) => p.id !== postId)
      savePostsToStorage(updatedPosts)
      return updatedPosts
    })
    toast.success('게시글이 삭제되었습니다.')
  }

  // 글 올리기 후 초안 초기화
  const handleClearDraft = () => {
    setPostContent('')
    setSelectedEmotion(null)
  }

  const handleCreatePost = () => {
    const content = postContent.trim()
    if (!content) {
      toast.error('내용을 입력해주세요.')
      return
    }

    const newPost = {
      id: Date.now(),
      emotion: selectedEmotion || '기타',
      time: '방금',
      content,
      likes: 0,
      liked: false,
      comments: [],
      createdAt: new Date().toISOString(),
    }

    setPosts((prev) => {
      const updatedPosts = [newPost, ...prev]
      savePostsToStorage(updatedPosts)
      return updatedPosts
    })
    handleClearDraft()
    toast.success('게시글이 등록되었습니다.')
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
            {sortType}
            <span className="ml-1 md:ml-2">▾</span>
          </Button>
          {showSortPopup && (
            <div className="absolute right-0 z-10 mt-2 w-36 rounded-xl border bg-white p-1 shadow">
              {['최신순', '댓글순', '좋아요순'].map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    setSortType(opt)
                    setShowSortPopup(false)
                    setPosts((prev) => {
                      let sortedPosts = [...prev]
                      if (opt === '최신순') {
                        sortedPosts.sort(
                          (a, b) =>
                            new Date(b.createdAt) - new Date(a.createdAt)
                        )
                      } else if (opt === '좋아요순') {
                        sortedPosts.sort((a, b) => b.likes - a.likes)
                      } else if (opt === '댓글순') {
                        sortedPosts.sort(
                          (a, b) => b.comments.length - a.comments.length
                        )
                      }
                      return sortedPosts
                    })
                  }}
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
          <div className="flex flex-wrap items-center gap-2">
            {EMOTIONS.map((emo) => (
              <button
                key={emo}
                onClick={() => setSelectedEmotion(emo)}
                className={`rounded-full border px-3 py-1.5 text-sm md:py-1 ${
                  selectedEmotion === emo
                    ? 'border-neutral-800'
                    : 'border-neutral-300'
                } transition-transform active:scale-95`}
                aria-pressed={selectedEmotion === emo}
              >
                {emo}
              </button>
            ))}
          </div>
          <Textarea
            placeholder="지금 마음을 적어보세요..."
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            className="min-h-[100px] text-sm md:min-h-[120px] md:text-base"
          />
          <div className="flex justify-end">
            <Button
              onClick={handleCreatePost}
              className="h-10 px-6 text-sm md:h-10 md:px-6 md:text-base"
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
                  {/* 왼쪽: 아바타 + 감정 원 */}
                  <div className="mt-0.5 flex items-center gap-2 md:gap-3">
                    <Avatar className="h-9 w-9 md:h-10 md:w-10">
                      <AvatarFallback className="text-sm">AN</AvatarFallback>
                    </Avatar>
                    <EmotionCircle label={post.emotion} />
                  </div>

                  {/* 오른쪽: 시간 + 삭제하기 */}
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-neutral-500 md:text-sm">
                      {post.time}
                    </span>
                    <Button
                      variant="ghost"
                      className="h-7 px-2 text-xs text-red-600 hover:text-red-700 md:h-7 md:px-2 md:text-xs"
                      onClick={() => handleDeletePost(post.id)}
                    >
                      삭제하기
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 px-4 pb-4 md:px-6 md:pb-6">
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-neutral-800 md:text-[15px]">
                  {post.content}
                </p>

                {/* 액션바 */}
                <div className="mt-1 flex items-center gap-4">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-1 text-sm transition active:scale-95 ${
                      post.liked
                        ? 'text-red-600'
                        : 'text-neutral-600 hover:text-neutral-800'
                    }`}
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
                    <span>{post.comments.length}</span>
                  </div>
                </div>

                {/* 댓글 목록 */}
                {post.comments.length > 0 && (
                  <div className="mt-2 space-y-2 rounded-lg bg-neutral-50 p-3">
                    {post.comments.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-start justify-between gap-3"
                      >
                        <p className="text-sm text-neutral-800">{c.text}</p>
                        <span className="shrink-0 text-xs text-neutral-500">
                          {c.createdAt ? getRelativeTime(c.createdAt) : c.time}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 댓글 입력 */}
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="댓글을 입력하세요"
                    value={commentInputs[post.id] ?? ''}
                    onChange={(e) =>
                      handleCommentChange(post.id, e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleAddComment(post.id)
                      }
                    }}
                    className="h-10 text-sm md:h-10 md:text-base"
                  />
                  <Button
                    className="h-10 text-sm md:h-10 md:text-base"
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
