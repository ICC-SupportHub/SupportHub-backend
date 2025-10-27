'use client'
import { useRef, useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from '@/components/ui/use-toast'
import {
  SendIcon,
  BotIcon,
  UserIcon,
  ShareIcon,
  CopyIcon,
  CheckIcon,
  BookOpenIcon,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { apiChat } from '@/lib/api'

function ChatPageContent() {
  const scrollAreaRef = useRef(null)
  const inputRef = useRef(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const topic = searchParams.get('topic')

  const [shareUrl, setShareUrl] = useState('')
  const [isSharing, setIsSharing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [currentConversationId, setCurrentConversationId] = useState(null)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // 🧠 주제별 첫 메시지
  const getInitialMessage = (topic) => {
    const msgs = {
      loneliness:
        '안녕하세요! 외로움을 느끼고 계시는군요. 혼자라는 느낌이 들 때가 있죠. 제가 함께 있어드릴게요. 어떤 부분이 가장 외로우신가요? 😊',
      stress:
        '안녕하세요! 스트레스를 받고 계시는군요. 일상의 압박감이 힘드실 때가 있죠. 어떤 일이 가장 스트레스가 되시나요? 함께 풀어보아요. 😌',
      'self-criticism':
        '안녕하세요! 자신을 너무 혹독하게 대하고 계시는군요. 완벽하지 않아도 괜찮아요. 어떤 부분에서 자신을 비난하고 계신가요? 🤗',
      depression:
        '안녕하세요! 마음이 무겁고 우울하신가요? 그런 감정을 느끼는 것은 당연해요. 제가 함께 있어드릴게요. 어떤 일이 가장 힘드신가요? 😔',
      anxiety:
        '안녕하세요! 불안하고 걱정이 많으신가요? 불안한 마음을 이해해요. 어떤 것이 가장 걱정되시나요? 함께 차분히 정리해보아요. 🧘‍♀️',
      general:
        '안녕하세요! 저는 당신의 감정을 이해하고 공감하는 AI입니다. 오늘 기분은 어떠신가요? 무엇이든 편하게 말씀해 주세요. 😊',
    }
    return msgs[topic] || msgs.general
  }

  // 초기 메시지 상태
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: getInitialMessage(topic),
      createdAt: new Date(),
    },
  ])

  // 입력 핸들러
  const handleUserInput = (e) => setInput(e.target.value)

  // ✅ 메시지 전송
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    if (!user) {
      toast({
        title: '로그인이 필요합니다',
        description: '로그인 후 대화를 저장하고 이어서 사용할 수 있어요.',
        variant: 'destructive',
      })
    }

    const now = new Date()
    const userMessage = {
      id: `${now.getTime()}`,
      role: 'user',
      content: input,
      createdAt: now,
    }

    // UI 먼저 업데이트
    const draft = [...messages, userMessage]
    setMessages(draft)
    const currentInput = input
    setInput('')
    setIsLoading(true)

    try {
      // 1️⃣ 대화방이 없으면 생성
      let cid = currentConversationId
      if (!cid) {
        const title = `AI와의 감정 대화 - ${new Date().toLocaleDateString('ko-KR')}`
        const created = await apiChat.createConversation({
          title,
          topic: topic || 'general',
        })
        cid = created?.id || created?.conversationId || created?.data?.id
        if (!cid) throw new Error('대화 생성 실패')
        setCurrentConversationId(cid)
      }

      // 2️⃣ 서버로 메시지 + 주제 함께 전송
      const sent = await apiChat.sendMessage(cid, {
        userMessage: currentInput,
        topic: topic || 'general',
      })

      // 3️⃣ 서버 응답 해석
      let assistantMessage = null
      if (sent?.message) assistantMessage = sent.message
      else if (Array.isArray(sent?.messages))
        assistantMessage = sent.messages[sent.messages.length - 1]
      else if (typeof sent?.content === 'string')
        assistantMessage = {
          id: `${Date.now() + 1}`,
          role: 'assistant',
          content: sent.content,
          createdAt: new Date(),
        }

      // 4️⃣ 응답 없으면 fallback
      if (!assistantMessage) {
        assistantMessage = {
          id: `${Date.now() + 1}`,
          role: 'assistant',
          content:
            '서버에서 응답을 받지 못했어요. 잠시 후 다시 시도해 주세요.',
          createdAt: new Date(),
        }
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      console.error(err)
      const msg =
        err?.message?.includes('401') || err?.message?.includes('403')
          ? '로그인이 만료되었거나 권한이 없습니다. 다시 로그인해 주세요.'
          : '메시지 전송 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.'
      toast({
        title: '전송 실패',
        description: msg,
        variant: 'destructive',
      })
      setMessages((prev) => prev.slice(0, -1))
      setInput(currentInput)
    } finally {
      setIsLoading(false)
    }
  }

  // 공유 기능
  const handleShareConversation = async () => {
    if (messages.length <= 1) {
      toast({
        title: '공유할 대화가 없습니다',
        description: 'AI와 대화를 나눈 후 공유해보세요.',
        variant: 'destructive',
      })
      return
    }

    setIsSharing(true)
    try {
      const response = await fetch('/api/share-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          title: `AI와의 감정 대화 - ${new Date().toLocaleDateString('ko-KR')}`,
        }),
      })
      const data = await response.json()

      if (data.success) {
        const fullUrl = `${window.location.origin}${data.shareUrl}`
        setShareUrl(fullUrl)
        toast({
          title: '대화 공유 링크가 생성되었습니다!',
          description: '링크를 복사해서 다른 사람들과 공유해보세요.',
        })
      } else throw new Error(data.error)
    } catch (error) {
      toast({
        title: '공유 링크 생성 실패',
        description: '다시 시도해주세요.',
        variant: 'destructive',
      })
    } finally {
      setIsSharing(false)
    }
  }

  // 복사 기능
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast({
        title: '링크가 복사되었습니다!',
        description: '이제 다른 사람들과 공유할 수 있습니다.',
      })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({
        title: '복사 실패',
        description: '링크를 수동으로 복사해주세요.',
        variant: 'destructive',
      })
    }
  }

  useEffect(() => {
    if (scrollAreaRef.current)
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Header */}
      <div className="border-b bg-white px-4 py-3 dark:bg-gray-800 md:px-6 md:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <Avatar className="h-9 w-9 md:h-8 md:w-8">
              <AvatarFallback className="bg-purple-100 text-purple-600">
                <BotIcon className="h-4 w-4 md:h-4 md:w-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-base font-semibold text-gray-900 dark:text-white md:text-base">
                감정 공감 AI
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 md:text-sm">
                {isLoading ? '생각하는 중...' : '당신의 마음을 이해합니다'}
              </p>
            </div>
          </div>

          {/* Share */}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="flex h-9 items-center gap-1 bg-transparent px-2.5 text-xs md:h-9 md:gap-2 md:px-4 md:text-sm"
              >
                <ShareIcon className="h-4 w-4" />
                <span className="hidden sm:inline">대화 공유</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>대화 공유하기</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  AI와 나눈 대화를 다른 사람들과 공유할 수 있습니다. 개인정보는
                  제거되고 대화 내용만 공유됩니다.
                </p>

                {!shareUrl ? (
                  <Button
                    onClick={handleShareConversation}
                    disabled={isSharing}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {isSharing ? '공유 링크 생성 중...' : '공유 링크 생성'}
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Input value={shareUrl} readOnly className="flex-1" />
                      <Button
                        size="sm"
                        onClick={copyToClipboard}
                        className="flex items-center gap-1"
                      >
                        {copied ? (
                          <CheckIcon className="h-4 w-4" />
                        ) : (
                          <CopyIcon className="h-4 w-4" />
                        )}
                        {copied ? '복사됨' : '복사'}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      이 링크를 통해 다른 사람들이 대화를 볼 수 있습니다.
                    </p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 메시지 목록 */}
      <ScrollArea className="flex-1 px-4 md:px-6" ref={scrollAreaRef}>
        <div className="mx-auto max-w-3xl space-y-4 py-4 md:space-y-6 md:py-6">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-2 md:gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <Avatar className="h-8 w-8 flex-shrink-0 md:h-8 md:w-8">
                <AvatarFallback
                  className={
                    m.role === 'user'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-purple-100 text-purple-600'
                  }
                >
                  {m.role === 'user' ? (
                    <UserIcon className="h-4 w-4" />
                  ) : (
                    <BotIcon className="h-4 w-4" />
                  )}
                </AvatarFallback>
              </Avatar>
              <div
                className={`max-w-[80%] flex-1 ${m.role === 'user' ? 'text-right' : ''}`}
              >
                <div
                  className={`inline-block rounded-xl p-3 md:rounded-2xl md:p-4 ${
                    m.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-[15px] leading-relaxed md:text-sm">
                    {m.content}
                  </p>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {new Date(m.createdAt || Date.now()).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-2 md:gap-4">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-purple-100 text-purple-600">
                  <BotIcon className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="rounded-xl bg-gray-100 p-3 dark:bg-gray-700 md:rounded-2xl md:p-4">
                <div className="flex space-x-1">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
                  <div
                    className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                    style={{ animationDelay: '0.1s' }}
                  ></div>
                  <div
                    className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                    style={{ animationDelay: '0.2s' }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* 입력 영역 */}
      <div className="border-t bg-white p-4 dark:bg-gray-800 md:p-6">
        <div className="mx-auto max-w-3xl">
          <form onSubmit={handleSubmit} className="flex gap-2 md:gap-4">
            <Input
              ref={inputRef}
              type="text"
              placeholder="메시지를 입력하세요..."
              value={input}
              onChange={handleUserInput}
              className="h-11 flex-1 text-sm md:h-12 md:text-base"
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="h-11 bg-purple-600 px-4 hover:bg-purple-700 md:h-12 md:px-6"
            >
              <SendIcon className="h-4 w-4 md:h-4 md:w-4" />
            </Button>
          </form>

          {/* 감정일기 이동 */}
          <div className="mt-3 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center sm:gap-4 md:mt-4">
            <p className="text-xs text-gray-500">
              AI는 실수할 수 있습니다. 심각한 상황에서는 전문가의 도움을 받으세요.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')
                const diaryContent = lastUserMsg?.content || ''
                const params = new URLSearchParams()
                if (diaryContent) params.set('content', diaryContent)
                router.push(`/emotion-diary?${params.toString()}`)
              }}
              className="flex h-10 w-full items-center gap-1.5 text-xs sm:w-auto md:h-9 md:gap-2 md:text-sm"
            >
              <BookOpenIcon className="h-4 w-4" />
              감정 일기에 저장
            </Button>
          </div>
        </div>
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
