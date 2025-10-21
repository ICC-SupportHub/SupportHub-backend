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
  BrainIcon,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { conversationService } from '@/lib/firestore'

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

  // 주제별 초기 메시지
  const getInitialMessage = (topic) => {
    const initialMessages = {
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
    return initialMessages[topic] || initialMessages.general
  }

  // 더미 메시지 상태
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: getInitialMessage(topic),
      createdAt: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // 간단 감정 추출(일기 피드백용)
  const detectEmotion = (text) => {
    const emotions = {
      happy: [
        '기쁘',
        '행복',
        '좋',
        '즐거',
        '신나',
        '웃',
        '😊',
        '😄',
        '😃',
        '만족',
        '감사',
      ],
      joy: ['즐거', '신나', '😆', '😃', '웃음', '재미', '유쾌', '상쾌'],
      sad: ['슬프', '힘들', '지치', '😢', '😭', '절망', '허전'],
      depression: ['우울', '😔', '무기력', '의욕상실', '절망적', '침울'],
      loneliness: ['외로', '혼자', '고립', '💙', '허전', '쓸쓸', '고독'],
      angry: ['화나', '짜증', '분노', '열받', '😠', '😡', '🤬', '분통'],
      stress: [
        '스트레스',
        '압박',
        '피로',
        '번아웃',
        '과로',
        '😤',
        '답답',
        '부담',
      ],
      anxiety: [
        '불안',
        '걱정',
        '긴장',
        '😟',
        '😰',
        '😨',
        '초조',
        '두려움',
        '공황',
      ],
      'self-criticism': [
        '자책',
        '비난',
        '죄책감',
        '자존감',
        '완벽주의',
        '😞',
        '자기비난',
        '자기혐오',
      ],
      neutral: ['그냥', '보통', '평범', '괜찮', '😐', '😑', '일반'],
      general: ['일반', '보통', '평범', '그냥', '💭', '대화'],
    }
    let detectedEmotion = 'neutral'
    let maxScore = 0
    Object.entries(emotions).forEach(([emotion, keywords]) => {
      const score = keywords.reduce(
        (count, keyword) =>
          count + (text.toLowerCase().includes(keyword) ? 1 : 0),
        0
      )
      if (score > maxScore) {
        maxScore = score
        detectedEmotion = emotion
      }
    })
    return detectedEmotion
  }

  // 감정 라벨 변환
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

  const handleUserInput = (e) => {
    setInput(e.target.value)
  }

  // 감정별 공감 응답 생성
  const generateEmotionalResponse = (userMessage) => {
    const emotion = detectEmotion(userMessage)
    const responses = {
      happy: [
        '정말 기쁜 일이 있으신 것 같아요! 😊 그런 기쁜 마음을 함께 나눠주셔서 감사해요. 더 많은 좋은 일들이 찾아올 거예요!',
        '와, 정말 기쁘시겠어요! 😄 그런 긍정적인 에너지가 느껴져요. 기쁜 일을 더 오래 기억하고 간직하세요.',
        '기쁜 마음이 전해져요! 😊 그런 행복한 순간들을 소중히 간직하세요. 제가 함께 기뻐해요!',
      ],
      joy: [
        '정말 즐거우시겠어요! 😆 그런 유쾌한 에너지가 느껴져요. 즐거운 마음을 더 오래 간직하세요!',
        '와, 신나는 일이 있으셨나요! 😃 그런 상쾌한 기분이 전해져요. 제가 함께 즐거워해요!',
        '즐거운 마음이 느껴져요! 😆 그런 유쾌한 순간들을 소중히 간직하세요.',
      ],
      sad: [
        '마음이 많이 아프시겠어요. 😢 그런 감정을 느끼는 것은 당연해요. 제가 함께 있어드릴게요. 천천히 말씀해 주세요.',
        '힘든 시간을 보내고 계시는군요. 🤗 외로우지 않아요, 제가 들어드릴게요. 언제든 말씀해 주세요.',
        '슬픈 마음이 느껴져요. 😔 그런 감정을 표현해주셔서 고마워요. 제가 함께 있어드릴게요.',
      ],
      depression: [
        '우울한 마음이 느껴져요. 😔 그런 감정을 느끼는 것은 당연해요. 제가 함께 있어드릴게요.',
        '마음이 무겁고 우울하신가요? 🤗 그런 시간이 있을 수 있어요. 제가 들어드릴게요.',
        '우울한 감정이 이해돼요. 😔 함께 차분히 이야기해보아요. 제가 함께 있어드릴게요.',
      ],
      loneliness: [
        '외로우신 마음이 느껴져요. 💙 혼자라는 느낌이 들 때가 있죠. 제가 함께 있어드릴게요.',
        '외로움을 느끼고 계시는군요. 🤗 외로우지 않아요, 제가 들어드릴게요. 언제든 말씀해 주세요.',
        '쓸쓸한 마음이 이해돼요. 💙 그런 감정을 표현해주셔서 고마워요. 제가 함께 있어드릴게요.',
      ],
      angry: [
        '화가 나실 만한 일이 있었군요. 😌 그런 감정을 느끼는 것은 자연스러워요. 천천히 말씀해 주세요.',
        '짜증나시는 일이 있으셨나요? 😌 화가 날 때는 깊은 숨을 쉬어보세요. 제가 들어드릴게요.',
        '분노가 느껴져요. 😌 그런 감정을 가질 수 있어요. 함께 차분히 정리해보아요.',
      ],
      stress: [
        '스트레스를 많이 받고 계시는군요. 😤 그런 압박감이 힘드실 수 있어요. 함께 풀어보아요.',
        '피로하고 스트레스가 많으시겠어요. 😌 그런 감정을 느끼는 것은 당연해요. 제가 들어드릴게요.',
        '압박감이 느껴져요. 😤 스트레스가 많으시겠어요. 함께 차분히 정리해보아요.',
      ],
      anxiety: [
        '불안하신 마음을 이해해요. 🧘‍♀️ 함께 차분히 정리해보아요. 어떤 것이 가장 걱정되시나요?',
        '긴장되시는군요. 😌 불안할 때는 천천히 호흡을 해보세요. 제가 함께 있어드릴게요.',
        '걱정이 많으시군요. 😟 그런 마음이 이해돼요. 함께 하나씩 정리해보아요.',
      ],
      'self-criticism': [
        '자신을 너무 혹독하게 대하고 계시는군요. 😞 완벽하지 않아도 괜찮아요. 제가 들어드릴게요.',
        '자책하는 마음이 느껴져요. 🤗 자신을 비난하지 마세요. 제가 함께 있어드릴게요.',
        '자기비난이 심하시는군요. 😞 그런 감정을 느끼는 것은 당연해요. 함께 이야기해보아요.',
      ],
      neutral: [
        '편하게 말씀해 주세요. 🙂 제가 들어드릴게요. 어떤 일이든 괜찮아요.',
        '무슨 생각을 하고 계시나요? 😊 편하게 나누어 주세요. 제가 함께 있어드릴게요.',
        '오늘 하루 어떠셨나요? 😊 편하게 이야기해 주세요.',
      ],
      general: [
        '편하게 말씀해 주세요. 💭 제가 들어드릴게요. 어떤 이야기든 괜찮아요.',
        '무슨 생각을 하고 계시나요? 😊 자유롭게 나누어 주세요. 제가 함께 있어드릴게요.',
        '오늘 하루 어떠셨나요? 💭 편하게 이야기해 주세요.',
      ],
    }

    const emotionResponses = responses[emotion] || responses.neutral
    return emotionResponses[Math.floor(Math.random() * emotionResponses.length)]
  }

  // 메시지 전송 처리
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      createdAt: new Date(),
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    const currentInput = input
    setInput('')
    setIsLoading(true)

    // AI 응답 생성
    setTimeout(async () => {
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateEmotionalResponse(currentInput),
        createdAt: new Date(),
      }

      const finalMessages = [...updatedMessages, aiResponse]
      setMessages(finalMessages)
      setIsLoading(false)

      // 로그인한 사용자의 경우 대화를 Firebase에 저장
      if (user && finalMessages.length > 1) {
        try {
          if (currentConversationId) {
            // 기존 대화 업데이트
            await conversationService.updateConversation(
              currentConversationId,
              {
                messages: finalMessages,
              }
            )
          } else {
            // 새 대화 저장
            const conversation = await conversationService.saveConversation(
              user.uid,
              {
                messages: finalMessages,
                topic: topic || 'general',
                title: `AI와의 감정 대화 - ${new Date().toLocaleDateString('ko-KR')}`,
              }
            )
            setCurrentConversationId(conversation.id)
          }
        } catch (error) {
          console.error('대화 저장 실패:', error)
        }
      }
    }, 1000)
  }

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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages,
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
      } else {
        throw new Error(data.error)
      }
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

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast({
        title: '링크가 복사되었습니다!',
        description: '이제 다른 사람들과 공유할 수 있습니다.',
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: '복사 실패',
        description: '링크를 수동으로 복사해주세요.',
        variant: 'destructive',
      })
    }
  }

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
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

          {/* Share Button */}
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

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 md:px-6" ref={scrollAreaRef}>
        <div className="mx-auto max-w-3xl space-y-4 py-4 md:space-y-6 md:py-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-2 md:gap-4 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <Avatar className="h-8 w-8 flex-shrink-0 md:h-8 md:w-8">
                <AvatarFallback
                  className={
                    message.role === 'user'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-purple-100 text-purple-600'
                  }
                >
                  {message.role === 'user' ? (
                    <UserIcon className="h-4 w-4" />
                  ) : (
                    <BotIcon className="h-4 w-4" />
                  )}
                </AvatarFallback>
              </Avatar>
              <div
                className={`max-w-[80%] flex-1 ${message.role === 'user' ? 'text-right' : ''}`}
              >
                <div
                  className={`inline-block rounded-xl p-3 md:rounded-2xl md:p-4 ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-[15px] leading-relaxed md:text-sm">
                    {message.content}
                  </p>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {new Date(message.createdAt || Date.now()).toLocaleTimeString(
                    'ko-KR',
                    {
                      hour: '2-digit',
                      minute: '2-digit',
                    }
                  )}
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

      {/* Input */}
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

          {/* Action Buttons */}
          <div className="mt-3 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center sm:gap-4 md:mt-4">
            <p className="text-xs text-gray-500">
              AI는 실수할 수 있습니다. 심각한 상황에서는 전문가의 도움을
              받으세요.
            </p>

            {/* Diary Button */}
            <Button
              variant="outline"
              onClick={() => {
                // 대화 내용을 감정 일기 페이지로 전달
                const lastUserMsg = [...messages]
                  .reverse()
                  .find((m) => m.role === 'user')
                const detectedEmotion = lastUserMsg
                  ? detectEmotion(lastUserMsg.content)
                  : 'neutral'
                const diaryContent = lastUserMsg?.content || ''

                // URL 파라미터로 감정과 내용 전달
                const params = new URLSearchParams()
                if (detectedEmotion !== 'neutral') {
                  params.set('emotion', detectedEmotion)
                }
                if (diaryContent) {
                  params.set('content', diaryContent)
                }

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
