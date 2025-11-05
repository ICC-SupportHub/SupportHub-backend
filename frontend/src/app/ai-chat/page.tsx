'use client'

import { useRef, useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from '@/components/ui/use-toast'
import { SendIcon, BotIcon, UserIcon, BookOpenIcon } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { apiChat } from '@/lib/api'

/** ✅ 서버가 주는 JSON(payload) → 화면용으로 파싱 */
function parseAssistantPayload(raw) {
  let cleaned = String(raw ?? '')
    .replace(/```+[\s\S]*?```+/g, s => s.replace(/```/g, ''))
    .trim()
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")

  const first = cleaned.indexOf('{')
  const last = cleaned.lastIndexOf('}')
  if (first >= 0 && last > first) {
    const candidate = cleaned.slice(first, last + 1)

    try {
      const obj = JSON.parse(candidate)
      if (obj && typeof obj.reply === 'string') {
        return {
          text: obj.reply,
          skill: obj.skill_tag || null,
          safety: obj.safety_level || 'ok',
          next: Array.isArray(obj.next_questions) ? obj.next_questions : [],
          suggestions: Array.isArray(obj.suggestions) ? obj.suggestions : [],
          diary: !!obj.diary_suggested,
          raw: obj,
        }
      }
    } catch {
      try {
        const fixed = candidate
          .replace(/([{,]\s*)'([^'"]+?)'\s*:/g, '$1"$2":')
          .replace(/:\s*'([^']*?)'(\s*[},])/g, ': "$1"$2')
        const obj2 = JSON.parse(fixed)
        if (obj2 && typeof obj2.reply === 'string') {
          return {
            text: obj2.reply,
            skill: obj2.skill_tag || null,
            safety: obj2.safety_level || 'ok',
            next: Array.isArray(obj2.next_questions) ? obj2.next_questions : [],
            suggestions: Array.isArray(obj2.suggestions) ? obj2.suggestions : [],
            diary: !!obj2.diary_suggested,
            raw: obj2,
          }
        }
      } catch {}
    }
  }
  return { text: typeof raw === 'string' ? raw : '[응답 파싱 실패]' }
}

/** ✅ 간단 감정 후보 추출 */
function detectEmotionCandidates(messages, topic) {
  const text = messages.slice(-6).map(m => m.content || '').join(' ')
  const picked = new Set()
  const addIf = (cond, label) => { if (cond && picked.size < 3) picked.add(label) }

  addIf(/외롭|고립|혼자|쓸쓸/.test(text) || topic === 'loneliness', '외로움')
  addIf(/불안|초조|긴장|두근|걱정/.test(text) || topic === 'anxiety', '불안')
  addIf(/우울|무기력|허무|무가치|의욕없/.test(text) || topic === 'depression', '우울')
  addIf(/스트레스|압박|버겁|과제|일정/.test(text) || topic === 'stress', '스트레스')
  addIf(/자책|자기비난|내탓|형편없/.test(text) || topic === 'self-criticism', '자기비난')
  addIf(/화나|분노|짜증|억울/.test(text), '분노')
  addIf(/슬프|서럽|눈물/.test(text), '슬픔')
  addIf(/안정|괜찮|좋아|감사|기쁨/.test(text), '기쁨')

  return Array.from(picked).slice(0, 3)
}

function ChatPageContent() {
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const topic = searchParams.get('topic') || undefined
  const isNewChat = searchParams.get('new')

  const [currentConversationId, setCurrentConversationId] = useState(null)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState([])

  /** ✅ 초기 인사 */
  const getInitialMessage = (topic) => {
    const msgs = {
      loneliness: '안녕하세요! 저는 감정을 함께 나누는 공감 AI입니다. 😊\n요즘 외로움이 잦다면, 어떤 순간에 가장 크게 올라오는지부터 들어볼게요.',
      stress: '안녕하세요! 저는 감정을 이해하고 도와드리는 공감 AI입니다. 🌿\n요즘 스트레스가 많으셨군요. 지금 바로 가볍게 줄일 수 있는 한 가지부터 찾아봐요.',
      'self-criticism': '안녕하세요! 저는 당신의 마음을 다정하게 비춰주는 공감 AI입니다. 🤗\n요즘 스스로에게 엄격해진 순간이 있었나요?',
      depression: '안녕하세요! 저는 마음이 무거울 때 옆에서 함께 걷는 공감 AI입니다. 🌧️\n힘을 덜 쓰는 작고 안전한 한 걸음부터 같이 정리해볼게요.',
      anxiety: '안녕하세요! 불안할 때 숨을 고르게 도와드리는 공감 AI입니다. 🕊️\n지금 이 자리에서 30초만 호흡을 가볍게 해볼까요?',
      general: '안녕하세요! 저는 감정을 함께 나누는 AI 상담 도우미입니다. 🌼\n무엇이든 편하게 이야기해 주세요. 저는 당신 편이에요.',
    }
    return (topic && msgs[topic]) || msgs.general
  }

  /** ✅ 대화 로드 */
  useEffect(() => {
    const loadConversation = async () => {
      if (isNewChat) {
        localStorage.removeItem('supporthub_cid')
        setCurrentConversationId(null)
        setMessages([{ id: 'welcome', role: 'assistant', content: getInitialMessage(topic), meta: null, createdAt: new Date() }])
        return
      }

      const savedCid = localStorage.getItem('supporthub_cid')
      if (savedCid) {
        setCurrentConversationId(savedCid)
        try {
          const history = await apiChat.getMessages(savedCid)
          const hydrated = (Array.isArray(history) ? history : []).map((m) => {
            if (m.role === 'assistant') {
              const parsed = parseAssistantPayload(m.content)
              return { id: m.id || Math.random().toString(), role: 'assistant', content: parsed.text, meta: parsed, createdAt: m.createdAt || new Date() }
            }
            return { id: m.id || Math.random().toString(), role: m.role, content: m.content, meta: null, createdAt: m.createdAt || new Date() }
          })
          setMessages(hydrated.length > 0 ? hydrated : [{ id: 'welcome', role: 'assistant', content: getInitialMessage(topic), meta: null, createdAt: new Date() }])
        } catch {
          setMessages([{ id: 'welcome', role: 'assistant', content: getInitialMessage(topic), meta: null, createdAt: new Date() }])
        }
      } else {
        setMessages([{ id: 'welcome', role: 'assistant', content: getInitialMessage(topic), meta: null, createdAt: new Date() }])
      }
    }
    loadConversation()
  }, [isNewChat, topic])

  /** ✅ 전송 */
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    if (!user) {
      toast({ title: '로그인이 필요합니다', description: '로그인 후 대화를 저장하고 이어서 사용할 수 있어요.', variant: 'destructive' })
      return
    }

    const now = new Date()
    const userMessage = { id: `${now.getTime()}`, role: 'user', content: input, meta: null, createdAt: now }
    setMessages(prev => [...prev, userMessage])
    const currentInput = input
    setInput('')
    setIsLoading(true)

    try {
      let cid = currentConversationId || localStorage.getItem('supporthub_cid')
      if (!cid) {
        const title = `AI와의 감정 대화 - ${new Date().toLocaleDateString('ko-KR')}`
        const created = await apiChat.createConversation({ title, topic: topic || 'general' })
        cid = created?.id ?? created?.conversationId
        if (!cid) throw new Error('대화 생성 실패')
        setCurrentConversationId(cid)
        localStorage.setItem('supporthub_cid', cid)
      }

      const sent = await apiChat.sendMessage(cid, { userMessage: currentInput, topic: topic || 'general' })
      const raw = sent?.reply || sent?.assistantMessage || sent?.message || sent?.content || ''
      const parsed = parseAssistantPayload(raw)

      setMessages(prev => [...prev, { id: `${Date.now() + 1}`, role: 'assistant', content: parsed.text || '서버 응답이 없습니다.', meta: parsed, createdAt: new Date() }])
    } catch (err) {
      console.error(err)
      toast({ title: '전송 실패', description: '잠시 후 다시 시도해주세요.', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [messages])
  useEffect(() => { inputRef.current?.focus() }, [])

  /** ✅ 감정일기 저장 */
  const handleSaveToDiary = () => {
    try {
      const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant')
      const lastUser = [...messages].reverse().find(m => m.role === 'user')

      const draft = {
        from: 'chat',
        conversationId: currentConversationId || null,
        createdAt: new Date().toISOString(),
        topic: topic || 'general',
        summary: lastAssistant?.content || '',
        lastUserText: lastUser?.content || '',
        skill: lastAssistant?.meta?.skill || null,
        safety: lastAssistant?.meta?.safety || 'ok',
        suggestions: Array.isArray(lastAssistant?.meta?.suggestions) ? lastAssistant.meta.suggestions.slice(0, 5) : [],
        nextQuestions: Array.isArray(lastAssistant?.meta?.next) ? lastAssistant.meta.next.slice(0, 2) : [],
        emotionCandidates: detectEmotionCandidates(messages, topic),
        recentMessages: messages.slice(-8).map(m => ({ role: m.role, content: m.content, at: m.createdAt })),
      }

      localStorage.setItem('supporthub_diary_draft', JSON.stringify(draft))
      router.push('/emotion-diary?from=chat')
    } catch (e) {
      console.error(e)
      toast({ title: '임시 저장 실패', description: '다시 시도해 주세요.', variant: 'destructive' })
    }
  }

  return (
    <div className="flex h-full flex-1 flex-col">
      {/* 헤더 */}
      <div className="border-b bg-white px-4 py-3 md:px-6 md:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-purple-100 text-purple-600">
                <BotIcon className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-base font-semibold">감정 공감 AI</h1>
              <p className="text-xs text-gray-500">{isLoading ? '생각하는 중...' : '당신의 마음을 이해합니다'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 메시지 */}
      <ScrollArea className="flex-1 px-4 md:px-6">
        <div className="mx-auto max-w-3xl space-y-4 py-4 md:space-y-6 md:py-6">
          {messages.map((m) => {
            const isUser = m.role === 'user'
            const meta = m.meta
            return (
              <div key={m.id} className={`flex gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className={isUser ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}>
                    {isUser ? <UserIcon /> : <BotIcon />}
                  </AvatarFallback>
                </Avatar>

                <div className={`max-w-[80%] ${isUser ? 'text-right' : ''}`}>
                  <div className={`inline-block rounded-xl p-3 ${isUser ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-900'}`}>
                    <p className="whitespace-pre-wrap text-sm">{m.content}</p>

                    {!isUser && meta && (
                      <div className="mt-2 space-y-2 text-xs">
                        <div className="flex flex-wrap items-center gap-2">
                          {meta.skill && (
                            <span className="rounded-md bg-white/70 px-2 py-1 text-[11px] font-medium text-gray-700">
                              기술: {meta.skill}
                            </span>
                          )}
                          {meta.safety && (
                            <span
                              className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                                meta.safety === 'crisis'
                                  ? 'bg-red-100 text-red-700'
                                  : meta.safety === 'check-in'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              안전수준: {meta.safety}
                            </span>
                          )}
                        </div>

                        {Array.isArray(meta.suggestions) && meta.suggestions.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {meta.suggestions.slice(0, 5).map((s, i) => (
                              <button
                                key={i}
                                type="button"
                                className="rounded-full border border-gray-300 bg-white px-3 py-1 hover:bg-gray-50"
                                onClick={() => setInput(prev => (prev ? prev : s))}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <p className="mt-1 text-xs text-gray-500">
                    {new Date(m.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* 입력 + 툴바 */}
      <div className="border-t bg-white p-4 md:p-6">
        <form onSubmit={handleSubmit} className="mx-auto flex max-w-3xl flex-col gap-3 md:gap-4">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              type="text"
              placeholder="메시지를 입력하세요..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={isLoading}
            />
            <Button type="submit" disabled={!input.trim() || isLoading} className="bg-purple-600 hover:bg-purple-700">
              <SendIcon className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-[12px] text-gray-500">AI는 실수할 수 있습니다. 심각한 상황에서는 전문가의 도움을 받으세요.</p>
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveToDiary}
              className="gap-2"
              title="최근 대화를 바탕으로 감정 일기 작성"
            >
              <BookOpenIcon className="h-4 w-4" />
              감정 일기에 저장
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatPageContent />
    </Suspense>
  )
}
