'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { CalendarIcon, LoaderIcon, EditIcon, TrashIcon } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { apiDiary } from '@/lib/api'

const initialEditor = {
  selectedEmotions: [],
  diaryEntry: '',
  aiFeedback: '',
  isSaved: false,
  isLoading: false,
  editingDiary: null,
}

const initialList = {
  savedDiaries: [],
  selectedDiary: null,
  showAll: false,
  isExpanded: false,
}

export default function EmotionDiary() {
  const searchParams = useSearchParams()
  const { user } = useAuth()

  const [editor, setEditor] = useState(initialEditor)
  const [list, setList] = useState(initialList)

  useEffect(() => {
    const emotion = searchParams.get('emotion')
    const content = searchParams.get('content')
    if (emotion) setEditor((p) => ({ ...p, selectedEmotions: [emotion] }))
    if (content)
      setEditor((p) => ({ ...p, diaryEntry: decodeURIComponent(content) }))
  }, [searchParams])

  useEffect(() => {
    const loadDiaries = async () => {
      try {
        if (user) {
          const diaries = await apiDiary.list()
          const normalized = Array.isArray(diaries)
            ? diaries.map((d) => ({
                id: d.id ?? d.diaryId ?? `${Date.now()}-${Math.random()}`,
                content: d.content ?? '',
                emotions: d.emotions ?? (d.emotion ? [d.emotion] : []),
                feedback: d.feedback ?? '',
                createdAt:
                  d.createdAt ?? d.created_at ?? new Date().toISOString(),
                updatedAt:
                  d.updatedAt ??
                  d.updated_at ??
                  d.createdAt ??
                  new Date().toISOString(),
              }))
            : []
          setList((p) => ({ ...p, savedDiaries: normalized }))
        } else {
          const saved = localStorage.getItem('emotion-diaries')
          if (saved)
            setList((p) => ({ ...p, savedDiaries: JSON.parse(saved) }))
        }
      } catch {
        const saved = localStorage.getItem('emotion-diaries')
        if (saved)
          setList((p) => ({ ...p, savedDiaries: JSON.parse(saved) }))
      }
    }
    loadDiaries()
  }, [user])

  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })

  const handleSaveDiary = async () => {
    if (!(editor.selectedEmotions.length > 0 && editor.diaryEntry.trim())) {
      setEditor((p) => ({
        ...p,
        aiFeedback: '감정을 최소 1개 선택하고 일기 내용을 입력해주세요.',
      }))
      return
    }

    setEditor((p) => ({ ...p, isLoading: true }))
    try {
      // 피드백 생성(Next API Route, 필요시 백엔드 엔드포인트로 대체 가능)
      const res = await fetch('/api/diary-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emotions: editor.selectedEmotions,
          diaryEntry: editor.diaryEntry,
        }),
      })
      const data = await res.json()
      const feedback = data?.feedback ?? ''

      if (editor.editingDiary) {
        if (user) {
          await apiDiary.update(editor.editingDiary.id, {
            emotions: editor.selectedEmotions,
            content: editor.diaryEntry,
            feedback,
          })
          setList((prev) => ({
            ...prev,
            savedDiaries: prev.savedDiaries.map((d) =>
              d.id === editor.editingDiary.id
                ? {
                    ...d,
                    emotions: editor.selectedEmotions,
                    content: editor.diaryEntry,
                    feedback,
                    updatedAt: new Date().toISOString(),
                  }
                : d
            ),
          }))
        } else {
          const updated = list.savedDiaries.map((d) =>
            d.id === editor.editingDiary.id
              ? {
                  ...d,
                  emotions: editor.selectedEmotions,
                  content: editor.diaryEntry,
                  feedback,
                  updatedAt: new Date().toISOString(),
                  date: d.date,
                  createdAt: d.createdAt,
                }
              : d
          )
          setList((p) => ({ ...p, savedDiaries: updated }))
          localStorage.setItem('emotion-diaries', JSON.stringify(updated))
        }
      } else {
        if (user) {
          const created = await apiDiary.create({
            emotions: editor.selectedEmotions,
            content: editor.diaryEntry,
            feedback,
          })
          const newDiary = {
            id: created?.id ?? created?.diaryId ?? `${Date.now()}`,
            emotions: created?.emotions ?? editor.selectedEmotions,
            content: created?.content ?? editor.diaryEntry,
            feedback: created?.feedback ?? feedback,
            createdAt:
              created?.createdAt ??
              created?.created_at ??
              new Date().toISOString(),
            updatedAt:
              created?.updatedAt ??
              created?.updated_at ??
              created?.createdAt ??
              new Date().toISOString(),
          }
          setList((p) => ({
            ...p,
            savedDiaries: [newDiary, ...p.savedDiaries],
          }))
        } else {
          const newDiary = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            emotions: editor.selectedEmotions,
            content: editor.diaryEntry,
            feedback,
            createdAt: new Date().toISOString(),
          }
          const updated = [...list.savedDiaries, newDiary]
          setList((p) => ({ ...p, savedDiaries: updated }))
          localStorage.setItem('emotion-diaries', JSON.stringify(updated))
        }
      }

      setEditor({
        selectedEmotions: editor.selectedEmotions,
        diaryEntry: editor.diaryEntry,
        aiFeedback: feedback,
        isSaved: true,
        isLoading: false,
        editingDiary: null,
      })
    } catch {
      setEditor((p) => ({
        ...p,
        aiFeedback:
          '피드백을 가져오는 중 오류가 발생했습니다. 다시 시도해 주세요.',
      }))
    } finally {
      setEditor((p) => ({ ...p, isLoading: false }))
    }
  }

  const handleEditDiary = (diary) => {
    setEditor((p) => ({
      ...p,
      editingDiary: diary,
      selectedEmotions: diary.emotions || (diary.emotion ? [diary.emotion] : []),
      diaryEntry: diary.content,
      aiFeedback: diary.feedback,
      isSaved: true,
    }))
  }

  const handleDeleteDiary = async (diaryId) => {
    try {
      if (user) {
        await apiDiary.remove(diaryId)
      } else {
        const updated = list.savedDiaries.filter((d) => d.id !== diaryId)
        localStorage.setItem('emotion-diaries', JSON.stringify(updated))
      }
      setList((p) => ({
        ...p,
        savedDiaries: p.savedDiaries.filter((d) => d.id !== diaryId),
      }))
    } catch (e) {
      console.error('일기 삭제 실패:', e)
    }
  }

  const handleNewDiary = () =>
    setEditor({
      selectedEmotions: [],
      diaryEntry: '',
      aiFeedback: '',
      isSaved: false,
      isLoading: false,
      editingDiary: null,
    })

  const getEmotionLabel = (emotion) => {
    const labels = {
      happy: '기쁨 😊',
      joy: '즐거움 😆',
      sad: '슬픔 😢',
      depression: '우울감 😔',
      loneliness: '외로움 💙',
      angry: '화남 😠',
      stress: '스트레스 😤',
      anxiety: '불안감 😟',
      'self-criticism': '자기비난 😞',
      neutral: '평온 😐',
      general: '일반 💭',
    }
    return labels[emotion] || '보통 😐'
  }

  const getEmotionsLabel = (emotions) => {
    if (!emotions || emotions.length === 0) return '감정 없음'
    if (emotions.length === 1) return getEmotionLabel(emotions[0])
    return emotions.map(getEmotionLabel).join(', ')
  }

  const emotions = [
    { name: 'happy', emoji: '😊', label: '기쁨' },
    { name: 'joy', emoji: '😆', label: '즐거움' },
    { name: 'sad', emoji: '😢', label: '슬픔' },
    { name: 'depression', emoji: '😔', label: '우울감' },
    { name: 'loneliness', emoji: '💙', label: '외로움' },
    { name: 'angry', emoji: '😠', label: '화남' },
    { name: 'stress', emoji: '😤', label: '스트레스' },
    { name: 'anxiety', emoji: '😟', label: '불안감' },
    { name: 'self-criticism', emoji: '😞', label: '자기비난' },
    { name: 'neutral', emoji: '😐', label: '평온' },
    { name: 'general', emoji: '💭', label: '일반' },
  ]

  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Header */}
      <div className="border-b bg-white px-4 py-3 dark:bg-gray-800 md:px-6 md:py-4">
        <div className="flex items-center gap-3">
          <CalendarIcon className="h-5 w-5 text-purple-600 md:h-6 md:w-6" />
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white md:text-xl">
              감정 일기
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 md:text-sm">
              {today}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="flex h-full flex-col md:flex-row">
          {/* 작성 */}
          <div className="flex-1 overflow-auto p-4 md:p-6">
            <div className="mx-auto max-w-2xl space-y-4 md:space-y-6">
              <div>
                <Label htmlFor="emotion-select" className="mb-3 block text-sm md:text-base">
                  오늘의 감정은 어떤가요? (최대 3개까지 선택 가능)
                </Label>
                <div className="flex flex-wrap gap-2 md:gap-3">
                  {emotions.map((emotion) => (
                    <Button
                      key={emotion.name}
                      variant={
                        editor.selectedEmotions.includes(emotion.name) ? 'default' : 'outline'
                      }
                      onClick={() => {
                        setEditor((prev) => {
                          const isSelected = prev.selectedEmotions.includes(emotion.name)
                          let next
                          if (isSelected) {
                            next = prev.selectedEmotions.filter((e) => e !== emotion.name)
                          } else {
                            if (prev.selectedEmotions.length >= 3) return prev
                            next = [...prev.selectedEmotions, emotion.name]
                          }
                          return {
                            ...prev,
                            selectedEmotions: next,
                            aiFeedback: prev.editingDiary ? prev.aiFeedback : '',
                            isSaved: prev.editingDiary ? true : false,
                            editingDiary: prev.editingDiary,
                          }
                        })
                      }}
                      className={`flex h-auto w-20 flex-col items-center justify-center p-3 text-lg md:w-24 md:p-4 ${
                        editor.selectedEmotions.includes(emotion.name)
                          ? 'bg-purple-500 text-white hover:bg-purple-600'
                          : editor.selectedEmotions.length >= 3
                            ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-500'
                            : 'border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800'
                      }`}
                    >
                      <span className="mb-1 text-2xl md:text-3xl">{emotion.emoji}</span>
                      <span className="text-xs md:text-sm">{emotion.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="diary-entry" className="mb-3 block text-sm md:text-base">
                  오늘 하루를 기록해 보세요.
                </Label>
                <Textarea
                  id="diary-entry"
                  placeholder="오늘 있었던 일이나 느낀 감정을 자유롭게 적어주세요..."
                  value={editor.diaryEntry}
                  onChange={(e) =>
                    setEditor((p) => ({
                      ...p,
                      diaryEntry: e.target.value,
                      aiFeedback: p.editingDiary ? p.aiFeedback : '',
                      isSaved: p.editingDiary ? true : false,
                      editingDiary: p.editingDiary,
                    }))
                  }
                  className="min-h[150px] text-[15px] focus-visible:ring-purple-500 md:min-h-[200px] md:text-base"
                />
              </div>

              {(() => {
                const ok =
                  editor.aiFeedback &&
                  editor.aiFeedback.trim() &&
                  editor.selectedEmotions.length > 0 &&
                  editor.diaryEntry.trim()
                return ok
              })() && (
                <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 text-purple-800 dark:bg-purple-950 dark:text-purple-200">
                  <p className="mb-2 font-semibold">AI의 한마디:</p>
                  <p className="leading-relaxed">{editor.aiFeedback}</p>
                </div>
              )}

              {editor.aiFeedback && editor.aiFeedback.trim() && !editor.isSaved && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:bg-red-950 dark:text-red-200">
                  <p className="mb-2 font-semibold">알림:</p>
                  <p className="leading-relaxed">{editor.aiFeedback}</p>
                </div>
              )}

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                <Button
                  variant="outline"
                  onClick={handleNewDiary}
                  disabled={editor.isLoading}
                  className="h-11 w-full sm:w-auto md:h-10"
                >
                  새 일기 작성
                </Button>
                <Button
                  onClick={handleSaveDiary}
                  disabled={editor.isLoading}
                  className="h-11 w-full bg-purple-600 px-6 hover:bg-purple-700 sm:w-auto md:h-10 md:px-8"
                >
                  {editor.isLoading ? (
                    <>
                      <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                      AI 피드백 생성 중...
                    </>
                  ) : editor.editingDiary ? (
                    '일기 수정'
                  ) : (
                    '일기 저장'
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* 목록 */}
          <div className="w-full border-t bg-gray-50 p-4 dark:bg-gray-900 md:w-80 md:border-l md:border-t-0">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white md:text-lg">
                저장된 일기
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({list.savedDiaries.length})
                </span>
              </h3>
              <button
                onClick={() => setList((p) => ({ ...p, isExpanded: !p.isExpanded }))}
                className="text-sm text-purple-600 hover:text-purple-700 md:hidden"
              >
                {list.isExpanded ? '접기 ▲' : '펼치기 ▼'}
              </button>
            </div>

            <div className={`space-y-3 ${list.isExpanded ? 'block' : 'hidden'} md:block`}>
              {list.savedDiaries.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  아직 저장된 일기가 없습니다.
                </p>
              ) : (
                (list.showAll ? list.savedDiaries : list.savedDiaries.slice(0, 3))
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .map((diary) => (
                    <div
                      key={diary.id}
                      onClick={() => setList((p) => ({ ...p, selectedDiary: diary }))}
                      className={`cursor-pointer rounded-lg border p-3 transition-all duration-200 hover:shadow-md ${
                        list.selectedDiary?.id === diary.id
                          ? 'border-purple-300 bg-purple-50 dark:border-purple-600 dark:bg-purple-950'
                          : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700'
                      }`}
                    >
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(diary.createdAt).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          weekday: 'long',
                        })}
                        {diary.updatedAt && diary.updatedAt !== diary.createdAt && (
                          <span className="ml-1 text-orange-500">(수정됨)</span>
                        )}
                      </p>
                      <p className="text-sm font-medium">
                        {getEmotionsLabel(diary.emotions || (diary.emotion ? [diary.emotion] : []))}
                      </p>
                      <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                        클릭하여 상세보기
                      </p>
                    </div>
                  ))
              )}
            </div>

            {list.savedDiaries.length > 3 && (
              <Button
                variant="ghost"
                className="mt-2 hidden w-full md:flex"
                onClick={() => setList((p) => ({ ...p, showAll: !p.showAll }))}
              >
                {list.showAll ? '접기 ▲' : '더보기 ▼'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 상세 모달 */}
      {list.selectedDiary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl dark:bg-gray-800">
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {new Date(list.selectedDiary.createdAt).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long',
                  })}{' '}
                  {list.selectedDiary.updatedAt &&
                    list.selectedDiary.updatedAt !== list.selectedDiary.createdAt && (
                      <span className="ml-2 text-sm text-orange-500">(수정됨)</span>
                    )}{' '}
                  -{' '}
                  {getEmotionsLabel(
                    list.selectedDiary.emotions ||
                      (list.selectedDiary.emotion ? [list.selectedDiary.emotion] : [])
                  )}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setList((p) => ({ ...p, selectedDiary: null }))}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="mb-2 font-semibold text-gray-900 dark:text-white">일기 내용</h4>
                  <div className="whitespace-pre-line rounded-lg bg-gray-50 p-4 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {list.selectedDiary.content}
                  </div>
                </div>
                {list.selectedDiary.feedback && (
                  <div>
                    <h4 className="mb-2 font-semibold text-gray-900 dark:text-white">AI 피드백</h4>
                    <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 text-purple-800 dark:border-purple-700 dark:bg-purple-950 dark:text-purple-200">
                      {list.selectedDiary.feedback}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    handleEditDiary(list.selectedDiary)
                    setList((p) => ({ ...p, selectedDiary: null }))
                  }}
                >
                  <EditIcon className="mr-2 h-4 w-4" />
                  수정
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleDeleteDiary(list.selectedDiary.id)
                    setList((p) => ({ ...p, selectedDiary: null }))
                  }}
                >
                  <TrashIcon className="mr-2 h-4 w-4" />
                  삭제
                </Button>
                <Button onClick={() => setList((p) => ({ ...p, selectedDiary: null }))}>
                  닫기
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
